import Ajv from "ajv";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import parseToolCall, { type ToolCall } from "./parseToolCall";
import type { ToolResponse, ToolStatus } from "../ecs/ecs-tools";
import type { AnyValidateFunction } from "ajv/dist/core";

const markdownProcessor = unified().use(remarkParse).use(remarkStringify);

export type ChatMessage = {
  role: "user" | "assistant" | "tool" | "error";
  content: string;
  toolCall?: ToolCall;
  toolStatus?: ToolStatus;
  retry?: string;
};

export class Conversation {
  thinking = $state(false);
  messages = $state<ChatMessage[]>([]);
  concept = $state<ChatMessage>();
  private systemPrompt: string;
  private tools: Record<string, LanguageModelTool>;
  private createLLM: typeof LanguageModel.create;
  private gameLogic: () => Promise<string | undefined>;
  private llm: LanguageModel | undefined;

  constructor(
    systemPrompt: string,
    tools: LanguageModelTool[],
    createLLM?: typeof LanguageModel.create,
    gameLogic?: () => Promise<string | undefined>,
  ) {
    this.tools = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
    this.createLLM = createLLM ?? ((options) => LanguageModel.create(options));
    this.gameLogic = gameLogic ?? (() => Promise.resolve(undefined));
    const toolsIntro = `

Available tools:

${tools.map((tool) => `${tool.name}: ${tool.description}`).join("\n")}
`;
    this.systemPrompt = systemPrompt + toolsIntro;
  }

  async prompt(message: string, options: { signal: AbortSignal }) {
    if (this.thinking) {
      throw new Error("Queuing prompts not yet supported");
    }
    this.thinking = true;
    this.messages.push({
      role: "user",
      content: message,
    });
    try {
      await this.execute((llm) =>
        this.processPrompt(llm, message, options.signal, 2),
      );
    } finally {
      this.thinking = false;
    }
  }
  private async processPrompt(
    llm: LanguageModel,
    message: string,
    signal: AbortSignal,
    retry: number,
    previousToolCall?: ToolCall,
  ): Promise<void> {
    let response = "";
    this.concept = { role: "assistant", content: "" };
    try {
      for await (const chunk of llm.promptStreaming(message, { signal })) {
        response += chunk;
        const pos = response.indexOf("```");
        this.concept.content =
          pos === -1 ? response : response.substring(0, pos);
      }
    } catch (err) {
      this.concept = undefined;
      this.messages.push({
        role: "error",
        content: signal.aborted
          ? "Cancelled"
          : `Streaming failed: ${(err as Error).message ?? "Unknown error"}`,
      });
      return;
    }

    const [nodes, toolCalls] = stripToolCalls(
      markdownProcessor.parse(response),
    );
    if (nodes.children.length > 0) {
      this.messages.push({
        role: "assistant",
        content: markdownProcessor.stringify(nodes),
      });
    }
    this.concept = undefined;

    if (toolCalls.length === 0) {
      if (nodes.children.length === 0) {
        this.messages.push({ role: "error", content: "Empty response" });
      }
      return;
    }
    let toolCall: ToolCall | undefined;
    try {
      if (toolCalls.length > 1) {
        console.warn(response);

        throw new Error("Only one toolcall per message is supported");
      }
      toolCall = parseToolCall(toolCalls[0].value);
      if (
        previousToolCall &&
        JSON.stringify(toolCall) === JSON.stringify(previousToolCall)
      ) {
        throw new Error("Toolcall is identical");
      }
      const tool = this.tools[toolCall.action];
      if (!tool) {
        throw new Error(`Tool "${toolCall.action}" doesn't exists`);
      }
      const params = toolCall.parameters;
      const validationError = validateParameters(
        tool.inputSchema as Record<string, unknown>,
        params,
      );
      if (validationError) {
        throw new Error(
          `tool "${toolCall.action}" was called incorrectly.\n${validationError}`,
        );
      }
      const index =
        this.messages.push({
          role: "tool",
          toolCall,
          content: "...",
        }) - 1;
      const result = (await tool.execute(params)) as ToolResponse;
      this.messages[index].toolStatus = result.toolStatus;
      let answer: string = result;
      this.messages[index].content = answer;

      if (result.toolStatus !== "failed") {
        const replacement = await this.gameLogic?.();
        if (replacement) {
          answer = replacement;
          this.messages[index].content = replacement;
        }
      }

      return this.processPrompt(
        llm,
        `<result name="${tool.name}">${answer}</result>`,
        signal,
        retry,
        toolCall,
      );
    } catch (err) {
      console.warn(`Failed to process LLM response:\n${response}`, {
        cause: err,
      });
      const reply = `<error>\n${(err as Error).message ?? "An error occurred"}\n</error>`;
      this.messages.push({
        role: "error",
        content: toolCall
          ? `An error occurred trying, "${toolCall.action}(${JSON.stringify(toolCall.parameters)})`
          : "Invalid tool call",
        retry: retry > 0 ? reply : "",
      });
      if (retry > 0) {
        return this.processPrompt(
          llm,
          reply,
          signal,
          retry - 1,
          previousToolCall,
        );
      }
      await llm.append([{ role: "user", content: reply }], { signal });
    }
  }

  async execute<T>(fn: (llm: LanguageModel) => Promise<T>): Promise<T> {
    this.llm ??= await this.createLLM({
      samplingMode: "predictable",
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      initialPrompts: [{ role: "system", content: this.systemPrompt }],
    });
    return fn(this.llm);
  }
}

type RootNode = ReturnType<typeof markdownProcessor.parse>;
type CodeNode = Extract<RootNode["children"][number], { type: "code" }>;

export function stripToolCalls(ast: RootNode): [RootNode, CodeNode[]] {
  const toolCalls: CodeNode[] = [];
  for (let i = ast.children.length - 1; i >= 0; i--) {
    const child = ast.children[i];
    if (
      child.type === "code" &&
      typeof child.lang === "string" &&
      ["tool_code", "tool_call"].includes(child.lang)
    ) {
      toolCalls.push(child);
      ast.children.splice(i, 1);
    }
  }
  return [ast, toolCalls.reverse()];
}

const ajv = new Ajv({ allErrors: true });
const validators: Record<string, AnyValidateFunction> = {};

function validateParameters(
  schema: Record<string, unknown>,
  data: object,
): false | string {
  const key = JSON.stringify(schema);
  if (!validators[key]) {
    validators[key] = ajv.compile(schema);
  }
  if (validators[key](data)) {
    return false;
  }
  return `the parameters don't match the json schema: \n"${ajv.errorsText(validators[key].errors)}\n\nExpected schema:\n${JSON.stringify(schema)}\n\nReceived data:\n${JSON.stringify(data)}\n\ntool_code format is using Python, example:\ntoolName(parameter="value")`;
}

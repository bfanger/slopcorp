import Ajv from "ajv";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import parseToolcall, { type ToolCall } from "./parseToolcall";

const markdownProcessor = unified().use(remarkParse).use(remarkStringify);
const ajv = new Ajv({ allErrors: true });

type ChatMessage = {
  role: "user" | "assistant" | "tool" | "error";
  content: string;
  toolCall?: ToolCall;
};

export class Conversation {
  thinking = $state(false);
  messages = $state<ChatMessage[]>([]);
  private systemPrompt: string;
  private tools: Record<string, LanguageModelTool>;
  private llm: LanguageModel | undefined;
  private validators: Record<string, ReturnType<Ajv["compile"]>> = {};

  constructor(systemPrompt: string, tools: LanguageModelTool[]) {
    this.tools = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
    for (const tool of tools) {
      try {
        this.validators[tool.name] = ajv.compile(tool.inputSchema);
      } catch (cause) {
        throw new Error(`Invalid inputSchema for tool "${tool.name}"`, {
          cause,
        });
      }
    }
    const toolsIntro = `

Available tools:

${tools.map((tool) => `${tool.name}: ${tool.description}\n`)}
`;
    const toolsWithInputSchema = `
Tool description with parameters:\n\n${JSON.stringify(
      {
        tools: tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
            strict: false,
          },
        })),
      },
      null,
      2,
    )}`;
    this.systemPrompt = systemPrompt + toolsIntro + toolsWithInputSchema;
  }

  async prompt(message: string) {
    if (this.thinking) {
      throw new Error("Queuing prompts not yet supported");
    }
    this.thinking = true;
    this.messages.push({
      role: "user",
      content: message,
    });
    try {
      await this.execute((llm) => this.processPrompt(llm, message));
    } finally {
      this.thinking = false;
    }
  }
  private async processPrompt(
    llm: LanguageModel,
    message: string,
    previousToolCall?: ToolCall,
  ): Promise<void> {
    const response = await llm.prompt(message);
    const [nodes, toolCalls] = stripToolCalls(
      markdownProcessor.parse(response),
    );
    if (nodes.children.length > 0) {
      this.messages.push({
        role: "assistant",
        content: markdownProcessor.stringify(nodes),
      });
    }

    if (toolCalls.length == 0) {
      if (nodes.children.length === 0) {
        this.messages.push({ role: "error", content: "Empty response" });
      }
      return;
    }
    try {
      if (toolCalls.length > 1) {
        console.warn(response);

        throw new Error("Only one toolcall per message is supported");
      }
      const toolCall = parseToolcall(toolCalls[0]!.value);
      if (
        previousToolCall &&
        JSON.stringify(toolCall) === JSON.stringify(previousToolCall)
      ) {
        throw new Error("Toolcall is identical");
      }
      const tool = this.tools[toolCall.name];
      if (!tool) {
        throw new Error(`Tool "${toolCall.name}" doesn't exists`);
      }
      const params = toolCall.args;
      this.assertValidArgs(toolCall.name, params);
      const answer = await tool.execute(params);
      this.messages.push({
        role: "tool",
        toolCall,
        content: answer,
      });
      return this.processPrompt(
        llm,
        `<result name="${tool.name}">${answer}</result>`,
        toolCall,
      );
    } catch (err) {
      console.warn(err);
      const content = (err as Error).message ?? "An error occurred";
      this.messages.push({ role: "error", content: content });
      const oops: LanguageModelMessage = {
        role: "user",
        content: `<error>${content}</error>`,
      };
      await llm.append([oops]);
    }
  }

  private assertValidArgs(toolName: string, params: object): void {
    const validate = this.validators[toolName];
    if (!validate) {
      return;
    }
    if (!validate(params)) {
      throw new Error(
        `Invalid arguments for tool "${toolName}": ` +
          ajv.errorsText(validate.errors),
      );
    }
  }

  async execute<T>(fn: (llm: LanguageModel) => Promise<T>): Promise<T> {
    if (!this.llm) {
      this.llm = await LanguageModel.create({
        samplingMode: "predictable",
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
        initialPrompts: [{ role: "system", content: this.systemPrompt }],
      });
    }
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

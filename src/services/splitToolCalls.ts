// https://www.linkedin.com/pulse/tool-calling-breaks-after-few-turns-gets-worse-when-gowrav-xh2wf/
// https://developers.openai.com/cookbook/articles/openai-harmony

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";

export const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkStringify);
export function splitToolCalls(response: string): {
  content: string;
  toolCalls: string[];
} {
  if (response.includes("<")) {
    const result = splitToolCallsXML(response);
    if (result.toolCalls.length > 0) {
      return result;
    }
  }
  return splitToolCallsCodeBlocks(response);
}

/**
 * Split Tool calls that use code blocks (Used by Gemini Nano)
 *
 *   ```tool_code
 *   getRooms()
 *   ```
 */
function splitToolCallsCodeBlocks(response: string): {
  content: string;
  toolCalls: string[];
} {
  const ast = markdownProcessor.parse(response);
  const toolCalls: string[] = [];
  for (let i = ast.children.length - 1; i >= 0; i--) {
    const child = ast.children[i];
    if (
      child.type === "code" &&
      typeof child.lang === "string" &&
      ["tool_code", "tool_call"].includes(child.lang)
    ) {
      toolCalls.push(child.value);
      ast.children.splice(i, 1);
    }
  }
  return {
    content: markdownProcessor.stringify(ast),
    toolCalls: toolCalls.reverse(),
  };
}

/**
 * Split Tool calls that use xml-ish blocks (Used by Gemma 4)
 *
 *   <|tool_call>call:getRooms()<tool_call|>
 */
export function splitToolCallsXML(response: string): {
  content: string;
  toolCalls: string[];
} {
  const toolCalls: string[] = [];
  let content = response.replace(
    /<\|tool_call>(?:([\s\S]*?)<tool_call\|>|([\s\S]+?)(?=\n|$|<\|tool_call))/g,
    (_: string, withClose: string | undefined, noClose: string | undefined) => {
      let toolCall = (withClose ?? noClose ?? "").trim();
      if (toolCall.startsWith("call:")) {
        toolCall = toolCall.slice(5);
      }
      if (toolCall) {
        toolCalls.push(toolCall);
      }
      return "";
    },
  );
  if (toolCalls.length > 0) {
    content = content.trimStart().replace(/^```$/, "");
  }
  return { content, toolCalls };
}

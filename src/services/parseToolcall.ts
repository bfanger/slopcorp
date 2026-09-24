import { literalEval, parse, toSource, type ExprNode } from "py-ast";

export type ToolCall = {
  action: string;
  parameters: Record<string, unknown>;
};

/**
 * Extract the tool call from a tool_code block.
 */
export default function parseToolcall(text: string): ToolCall {
  const ast = parse(text.trim());
  const stmt = ast.body[0];
  if (!stmt || stmt.nodeType !== "Expr") {
    throw new Error(`Expected a single expression in: ${text}`);
  }
  const expr: ExprNode = stmt.value;

  if (expr.nodeType === "Name") {
    // A call without ()
    return { action: expr.id, parameters: {} };
  }
  if (expr.nodeType !== "Call") {
    throw new Error(`Failed to extract toolcall from: ${text}`);
  }
  const func = expr.func;
  if (func.nodeType !== "Name") {
    throw new Error(`Failed to extract toolcall from: ${text}`);
  }
  const parameters: Record<string, unknown> = {};
  for (const kw of expr.keywords) {
    if (!kw.arg) {
      throw new Error("Unexpected parameter");
    }
    parameters[kw.arg] = literalEval(toSource(kw.value));
  }
  return { action: func.id, parameters: parameters };
}

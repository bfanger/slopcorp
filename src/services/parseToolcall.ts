import {
  literalEval,
  parse,
  toSource,
  type Constant,
  type ExprNode,
  type Name,
} from "py-ast";

export type ToolCall = {
  name: string;
  args: Record<string, unknown>;
};

/**
 * Extract which tool the LLM tried to call in a tool_code block.
 *
 * The block is parsed with py-ast, so invalid Python is rejected outright
 * instead of silently matching a substring.
 */
export default function parseToolcall(text: string): ToolCall {
  console.info({ text });
  const module = parse(text.trim());
  const stmt = module.body[0];
  let expr: ExprNode | undefined =
    stmt && stmt.nodeType === "Expr" ? stmt.value : undefined;

  // Unwrap a top-level print(...) wrapper.
  if (
    expr?.nodeType === "Call" &&
    expr.func.nodeType === "Name" &&
    expr.func.id === "print" &&
    expr.args.length === 1
  ) {
    expr = expr.args[0];
  }

  if (expr?.nodeType === "Name") {
    return { name: expr.id, args: {} };
  }

  if (expr?.nodeType === "Call" && expr.func.nodeType === "Name") {
    const tool = expr.func.id;
    const args: Record<string, unknown> = {};
    expr.args.forEach((arg, i) => {
      const value = toValue(arg);
      if (value !== undefined) args[String(i)] = value;
    });
    for (const kw of expr.keywords) {
      if (kw.arg) args[kw.arg] = toValue(kw.value);
    }
    return { name: tool, args };
  }

  throw new Error(`No tool call found in: ${text}`);
}

function toValue(node: ExprNode): unknown {
  if (node.nodeType === "Constant") return (node as Constant).value;
  if (node.nodeType === "Name") return (node as Name).id;
  try {
    return literalEval(toSource(node));
  } catch {
    return undefined;
  }
}

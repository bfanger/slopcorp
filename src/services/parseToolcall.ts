export type ToolCallSignature = {
  tool: string;
  arguments: unknown[];
};
/**
 * Extract which tool the LLM tried to call in a tool_code block.
 */
export default function parseToolcall(text: string): ToolCallSignature {
  const trimmed = text.trim();

  const printWrapper = /^print\((.*)\)$/s.exec(trimmed);
  const source = printWrapper ? printWrapper[1].trim() : trimmed;

  const call = /([A-Za-z_$][\w$]*)\s*\(([^()]*)\)/.exec(source);
  const bare = call ?? /([A-Za-z_$][\w$]*)/.exec(source);
  if (!bare) {
    throw new Error(`No tool call found in: ${text}`);
  }

  const arguments_: unknown[] = [];
  if (call && call[2].trim()) {
    const kwargs: Record<string, unknown> = {};
    for (const part of call[2].split(",")) {
      const eq = part.indexOf("=");
      if (eq === -1) continue;
      const key = part.slice(0, eq).trim();
      const raw = part.slice(eq + 1).trim();
      const quoted = /^(?:"([^"]*)"|'([^']*)')/.exec(raw);
      const num = Number(raw);
      kwargs[key] = quoted
        ? (quoted[1] ?? quoted[2])
        : Number.isNaN(num)
          ? raw
          : num;
    }
    if (Object.keys(kwargs).length) arguments_.push(kwargs);
  }

  return { tool: bare[1], arguments: arguments_ };
}

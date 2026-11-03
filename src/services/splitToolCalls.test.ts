import { describe, expect, it } from "vitest";
import { markdownProcessor, splitToolCalls } from "./splitToolCalls";

describe("splitToolCalls", () => {
  it("returns empty text and no tool calls for an empty response", () => {
    expect(splitToolCalls("")).toEqual({ content: "", toolCalls: [] });
  });

  it("keeps markdown without tool calls, normalizing list markers", () => {
    const markdown =
      "Here is the answer:\n\n- **bold** point\n- *italic* point\n\nDone!";
    expect(splitToolCalls(markdown)).toEqual({
      content:
        "Here is the answer:\n\n* **bold** point\n* *italic* point\n\nDone!\n",
      toolCalls: [],
    });
  });

  it("strips a single tool_code block and extracts it", () => {
    const response =
      "```tool_code\ngetWeather(city='Groningen')\n```\n\nIt's 19 degrees.";
    expect(splitToolCalls(response)).toEqual({
      content: "It's 19 degrees.\n",
      toolCalls: ["getWeather(city='Groningen')"],
    });
  });

  it("strips a single tool_call block and extracts it", () => {
    const response = "```tool_call\ngetInventory\n```";
    expect(splitToolCalls(response)).toEqual({
      content: "",
      toolCalls: ["getInventory"],
    });
  });

  it("strips a tool block at the start and preserves the rest", () => {
    const response =
      "```tool_code\ngetInventory\n```\n\nThe inventory is empty.";
    expect(splitToolCalls(response)).toEqual({
      content: "The inventory is empty.\n",
      toolCalls: ["getInventory"],
    });
  });

  it("preserves text between multiple tool blocks in order", () => {
    const response = [
      "First:",
      "```tool_call\ngetInventory\n```",
      "Then:",
      "```tool_code\ngetWeather(city='London')\n```",
      "Finally: 19 degrees.",
    ].join("\n\n");
    expect(splitToolCalls(response)).toEqual({
      content: "First:\n\nThen:\n\nFinally: 19 degrees.\n",
      toolCalls: ["getInventory", "getWeather(city='London')"],
    });
  });

  it("keeps non-tool fenced code blocks in place", () => {
    const response = "Run this:\n\n```python\nprint('hi')\n```\n\nand done.";
    const { content, toolCalls } = splitToolCalls(response);
    expect(toolCalls).toEqual([]);
    expect(content).toContain("```python\nprint('hi')\n```");
  });

  it("does not match tool languages case-insensitively", () => {
    const response = "```Tool_Code\ngetInventory\n```";
    const { content, toolCalls } = splitToolCalls(response);
    expect(toolCalls).toEqual([]);
    expect(content).toContain("getInventory");
  });

  it("extracts multi-line tool call contents as a single string", () => {
    const response =
      "```tool_code\ngetWeather(city='London')\ngetWeather(city='Paris')\n```";
    expect(splitToolCalls(response)).toEqual({
      content: "",
      toolCalls: ["getWeather(city='London')\ngetWeather(city='Paris')"],
    });
  });

  it("extracts an empty tool block", () => {
    expect(splitToolCalls("```tool_code\n```")).toEqual({
      content: "",
      toolCalls: [""],
    });
  });

  it("exposes a reusable markdown processor", () => {
    expect(markdownProcessor.processSync("a *b*").value).toBe("a *b*\n");
  });

  it("strips a single XML tool call and removes the call: prefix", () => {
    expect(splitToolCalls("<|tool_call>call:getRooms()")).toEqual({
      content: "",
      toolCalls: ["getRooms()"],
    });
  });

  it("strips a closing tag when present", () => {
    const response = "Hello\n<|tool_call>call:getRooms()\n<tool_call|>\nWorld";
    expect(splitToolCalls(response)).toEqual({
      content: "Hello\n\nWorld",
      toolCalls: ["getRooms()"],
    });
  });

  it("extracts a tool call with a parameter", () => {
    expect(splitToolCalls('<|tool_call>call:travelTo(room="office")')).toEqual({
      content: "",
      toolCalls: ['travelTo(room="office")'],
    });
  });

  it("extracts multiple tool calls in order", () => {
    const response = "a <|tool_call>call:x() <|tool_call>call:y() b";
    expect(splitToolCalls(response)).toEqual({
      content: "a ",
      toolCalls: ["x()", "y() b"],
    });
  });
});

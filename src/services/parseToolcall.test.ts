import { describe, expect, it } from "vitest";
import parseToolcall from "./parseToolcall";

describe("parseToolcall", () => {
  it.each([
    "getInventory",
    "getInventory()",
    "print(getInventory())",
  ])("%s returns the getInventory tool with no arguments", (text) => {
    expect(parseToolcall(text)).toEqual({
      tool: "getInventory",
      arguments: [],
    });
  });

  it("getWeather(location=London) returns the getWeather tool with a location argument", () => {
    expect(parseToolcall("getWeather(location=London)")).toEqual({
      tool: "getWeather",
      arguments: [{ location: "London" }],
    });
  });
});

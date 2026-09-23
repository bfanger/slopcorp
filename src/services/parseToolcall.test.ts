import { describe, expect, it } from "vitest";
import parseFunctioncall from "./parseToolcall";

describe("parseFunctioncall", () => {
  it.each(["getInventory", "getInventory()", "print(getInventory())"])(
    "%s returns the getInventory tool with no arguments",
    (text) => {
      expect(parseFunctioncall(text)).toEqual({
        tool: "getInventory",
        args: {},
      });
    },
  );

  it("getWeather(location=London) returns the getWeather tool with a location argument", () => {
    expect(parseFunctioncall("getWeather(location=London)")).toEqual({
      tool: "getWeather",
      args: { location: "London" },
    });
  });
  // @TODO support:
  // {"action": "getWeather", "parameters": {"city": "Amsterdam"}}

  // @TODO support:
  // getWeather city=London
});

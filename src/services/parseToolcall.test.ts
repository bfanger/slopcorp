import { describe, expect, it } from "vitest";
import parseFunctioncall from "./parseToolcall";

describe("parseFunctioncall", () => {
  it.each(["getInventory", "getInventory()"])(
    "%s returns the getInventory tool with empty parameters",
    (text) => {
      expect(parseFunctioncall(text)).toEqual({
        action: "getInventory",
        parameters: {},
      });
    },
  );
  it.each(["getWeather(location='London')", 'getWeather(location="London")'])(
    "%s returns the getWeather action with a location argument",
    (text) => {
      expect(parseFunctioncall(text)).toEqual({
        action: "getWeather",
        parameters: { location: "London" },
      });
    },
  );
  // @TODO support:
  // {"action": "getWeather", "parameters": {"city": "Amsterdam"}}

  // @TODO support:
  // getWeather city=London
});

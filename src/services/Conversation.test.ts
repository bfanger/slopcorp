import { describe, expect, it } from "vitest";
import { Conversation } from "./Conversation.svelte";

describe("Conversation", () => {
  it("executes the getWeather tool and returns the assistant's answer", async () => {
    const { createLLM, seenPrompts } = mockLLM([
      "```tool_code\ngetWeather(city='Groningen')\n```",
      "It's 19 degrees in Groningen.",
    ]);

    const chat = new Conversation("", [createDummyWeatherTool()], createLLM);
    const prompt = "Temperature in Groningen?";
    await chat.prompt(prompt);
    expect(seenPrompts).toEqual([
      prompt,
      '<result name="getWeather">{"temperature":19}</result>',
    ]);
    expect(chat.messages).toMatchInlineSnapshot(`
      [
        {
          "content": "Temperature in Groningen?",
          "role": "user",
        },
        {
          "content": "{"temperature":19}",
          "role": "tool",
          "toolCall": {
            "action": "getWeather",
            "parameters": {
              "city": "Groningen",
            },
          },
        },
        {
          "content": "It's 19 degrees in Groningen.
      ",
          "role": "assistant",
        },
      ]
    `);
  });

  it("records an error when the toolcall parameters are invalid", async () => {
    const { createLLM } = mockLLM([
      '```tool_code\ngetWeather(location="Groningen")\n```',
    ]);

    const chat = new Conversation("", [createDummyWeatherTool()], createLLM);
    const prompt = "What's the weather in Groningen?";
    await chat.prompt(prompt);

    expect(chat.messages.at(-1)).toMatchInlineSnapshot(`
      {
        "content": "tool "getWeather" was called incorrectly.
      the parameters don't match the json schema: 
      "data must have required property 'city'

      Expected schema:
      {"type":"object","properties":{"city":{"type":"string","description":"The city to check for the weather condition."}},"required":["city"]}

      Received data:
      {"location":"Groningen"}

      Tool call format:
      toolName(parameter="value")",
        "role": "error",
      }
    `);
  });
});

function mockLLM(responses: string[]) {
  const seenPrompts: string[] = [];
  const createLLM = () =>
    Promise.resolve({
      prompt: (message: string) => {
        seenPrompts.push(message);
        return Promise.resolve(responses.shift()!);
      },
      append: () => Promise.resolve(undefined),
    }) as unknown as Promise<LanguageModel>;
  return { createLLM, seenPrompts };
}

function createDummyWeatherTool(): LanguageModelTool {
  return {
    name: "getWeather",
    description: "Get the weather in a location.",
    inputSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "The city to check for the weather condition.",
        },
      },
      required: ["city"],
    },
    execute(args: { city: string }) {
      const cities: Record<string, number | undefined> = {
        groningen: 19,
      };
      const query = args.city.toLowerCase().trim();
      const temperature = cities[query];
      if (!temperature) {
        throw new Error(`Location "${args.city}" is not supported`);
      }
      return Promise.resolve(JSON.stringify({ temperature }));
    },
  };
}

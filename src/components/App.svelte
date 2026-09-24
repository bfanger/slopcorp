<script lang="ts">
  import { Conversation } from "../services/Conversation.svelte";
  const testPrompts = {
    weather1: "Where is it hotter? Amsterdam or Groningen?",
    weather2: "Where is it hotter? NY or LA?",
  };

  let prompt = $state(testPrompts.weather1);

  const chat = new Conversation(
    `
You are a helpful robot participating in a computer game.
The robot is owned by the SlopCorp company.

Your goal is to help the user achieve its goal by calling by using the available tools.
When the user is asking for information, use the information you've gathered with tools and give a clear answer.

- Before calling a tool describe the goal of that action without mentioning the name of the tool itself
- Don't make the exact same toolcall you've made in the previous message.
`,
    [
      {
        name: "getInventory",
        description: "Get a list of items you are carrying in your inventory",
        execute: () => Promise.resolve("inventory is empty"),
        inputSchema: {},
      },
      {
        name: "placeItem",
        description:
          "Place an item from your inventory into a specified target",
        inputSchema: {
          type: "object",
          properties: {
            item: { type: "string", description: "Name of the item" },
            target: { type: "string", description: "Where to place the item" },
          },
          required: ["item", "target"],
        },
        execute: () => Promise.resolve("that item is not in your inventory"),
      },
      {
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
        execute({ city }: { city: string }) {
          const temps: Record<string, number | undefined> = {
            groningen: 19,
            amsterdam: 21,
            "new york": 17,
            "los angeles": 16,
          };
          const query = city.toLowerCase().trim();
          const temp = temps[query];
          if (!temp) {
            throw new Error(`Location "${city}" is not supported`);
          }
          return Promise.resolve(
            JSON.stringify({
              temp,
              weather: Math.random() < 0.5 ? "sunny" : "rainy",
            }),
          );
        },
      },
    ],
  );
</script>

<div>
  <div class="flex w-fit min-w-160 flex-col gap-3 p-1 text-xs">
    {#each chat.messages as message, i (i)}
      {#if message.role === "error"}
        <div
          class="max-w-fit rounded-sm bg-orange-800 p-2 font-medium text-white"
        >
          {message.content}
        </div>
      {:else if message.role === "tool"}
        <div
          class="max-w-fit rounded-sm bg-teal-700 p-2 font-medium text-white"
          title={message.content}
        >
          {message.toolCall?.action}({JSON.stringify(
            message.toolCall?.parameters,
          )})
        </div>
      {:else}
        <pre
          class={`max-w-md rounded-2xl px-4 py-2 font-sans whitespace-pre-wrap ${
            message.role === "user"
              ? "ml-4 self-end bg-[#0b84ff] text-white"
              : "mr-4 self-start bg-[#e9e9eb] text-black"
          }`}>{message.content}</pre>
      {/if}
    {/each}
  </div>
  {#if chat.thinking}
    <div class="animate-pulse p-2 text-gray-700">Thinking...</div>
  {/if}
</div>
<form
  class="flex w-160"
  onsubmit={(e) => {
    e.preventDefault();
    void chat.prompt(prompt);
    prompt = "";
  }}
>
  <input
    bind:value={prompt}
    class="grow rounded-l-full border border-gray-700 px-4 py-2"
  />
  <button
    type="submit"
    class="rounded-r-full bg-[#0b84ff] p-2 px-4 font-medium text-white"
  >
    Send
  </button>
</form>

<script lang="ts">
  import { Conversation } from "../services/chat-fns.svelte";

  let prompt = $state("Where is it hotter? Amsterdam or Groningen?");

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
        async execute({ city }: { city: string }) {
          const temps: Record<string, number | undefined> = {
            groningen: 19,
            amsterdam: 21,
          };
          const query = city.toLowerCase().trim();
          const temp = temps[query];
          if (!temp) {
            throw new Error(`Location "${city}" is not supported`);
          }
          return JSON.stringify({
            temp,
            weather: Math.random() < 0.5 ? "sunny" : "rainy",
          });
        },
      },
    ],
  );
</script>

<div>
  <div class="flex flex-col text-xs w-fit min-w-160 p-1 gap-3">
    {#each chat.messages as message, i (i)}
      {#if message.role === "error"}
        <div
          class="bg-orange-800 text-white p-2 rounded-sm font-medium max-w-fit"
        >
          {message.content}
        </div>
      {:else if message.role === "tool"}
        <div
          class="bg-teal-700 text-white p-2 rounded-sm font-medium max-w-fit"
          title={message.content}
        >
          {message.toolCall?.name}({JSON.stringify(message.toolCall?.args)})
        </div>
      {:else}
        <pre
          class={"rounded-2xl px-4 py-2 whitespace-pre-wrap max-w-md font-sans " +
            (message.role === "user"
              ? "bg-[#0b84ff] text-white ml-4 self-end"
              : "bg-[#e9e9eb] text-black mr-4 self-start")}>{message.content}</pre>
      {/if}
    {/each}
  </div>
  {#if chat.thinking}
    <div class="animate-pulse text-gray-700 p-2">Thinking...</div>
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
    class="border border-gray-700 rounded-l-full py-2 px-4 grow"
  />
  <button
    type="submit"
    class="bg-[#0b84ff] text-white font-medium p-2 px-4 rounded-r-full"
  >
    Send
  </button>
</form>

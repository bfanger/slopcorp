<script lang="ts">
  import { untrack } from "svelte";
  import {
    getInventoryTool,
    getRoomsTool,
    moveToTool,
    placeItemTool,
    pickUpTool,
  } from "../ecs/ecs-tools";
  import { Conversation } from "../services/Conversation.svelte";
  import type ECS from "../ecs/ECS";
  import type { GameEvent } from "../ecs/ECS";

  type Props = {
    startPrompt: string;
    createLevel: (onEvent: (event: GameEvent) => void) => ECS;
  };
  let { startPrompt = "", createLevel }: Props = $props();
  let prompt = $state(untrack(() => startPrompt));

  let gameEvent: GameEvent | undefined;

  const ecs = untrack(() =>
    createLevel((e) => {
      gameEvent = e;
    }),
  );

  const chat = new Conversation(
    `
You are a helpful robot participating in a computer game.
The robot is owned by the SlopCorp company.

Your goal is to help the user achieve its goal by calling by using the available tools.
When the user is asking for information, use the information you've gathered with tools and give a clear answer.

- Before calling a tool describe the goal of that action without mentioning the name of the tool itself
- Don't make the exact same toolcall you've made in the previous message.
- tool_code format is using Python, for example: toolName(parameter="value")

Syntax examples of tool calls:

\`\`\`tool_code
getRooms()
\`\`\`

\`\`\`tool_code
moveTo(room="name_of_the_room")
\`\`\`


`,
    [
      getRoomsTool(ecs),
      moveToTool(ecs),
      getInventoryTool(ecs),
      pickUpTool(ecs),
      placeItemTool(ecs),
    ],
    undefined,
    () => {
      if (gameEvent) {
        const { delay = 0, message } = gameEvent;
        gameEvent = undefined;
        return new Promise((resolve) =>
          setTimeout(() => resolve(message), delay),
        );
      }
      return Promise.resolve(undefined);
    },
  );
  let messages = $derived([
    {
      role: "assistent",
      content: "Hi, I am SlopCorp's robot, how can i help you?",
    },
    ...chat.messages,
  ]);
</script>

<div>
  <div class="flex w-fit min-w-160 flex-col p-1 text-xs">
    {#each messages as message, i (i)}
      {#if message.role === "error"}
        <div
          class="max-w-fit rounded-sm bg-orange-800 p-2 font-medium text-white"
        >
          {message.content}
        </div>
      {:else if message.role === "tool"}
        <div
          class="mb-1 max-w-fit rounded-sm text-white {message.toolCallFailed
            ? 'bg-amber-700'
            : 'bg-teal-700'} px-2 py-1 leading-snug font-medium"
          title={message.content}
        >
          {message.toolCall?.action}({JSON.stringify(
            message.toolCall?.parameters,
          )})
        </div>
      {:else}
        <pre
          class={`mb-4 max-w-md rounded-2xl px-4 py-2 font-sans whitespace-pre-wrap ${
            message.role === "user"
              ? "ml-4 self-end rounded-br-xs bg-[#0b84ff] text-white"
              : "mr-4 self-start rounded-tl-xs bg-[#e9e9eb] text-black"
          }`}>{message.content}</pre>
      {/if}
    {/each}
  </div>
  {#if chat.thinking}
    <div class="animate-pulse p-2 font-medium text-gray-700">Thinking...</div>
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
    placeholder="Send an instruction to the robot"
    class="grow rounded-l-full border border-gray-700 px-4 py-2"
  />
  <button
    type="submit"
    class="rounded-r-full bg-[#0b84ff] p-2 px-4 font-medium text-white"
  >
    Send
  </button>
</form>

<script lang="ts">
  import { untrack } from "svelte";
  import {
    getInventoryTool,
    getRoomsTool,
    lookAtTool,
    placeItemTool,
    pickUpTool,
    travelToTool,
  } from "../ecs/ecs-tools";
  import {
    Conversation,
    type ChatMessage,
  } from "../services/Conversation.svelte";
  import { mockLLM } from "../services/mockLLM";
  import AutoScroll from "./AutoScroll.svelte";
  import type ECS from "../ecs/ECS";
  import avatar from "../assets/handdrawn/avatar.png";
  import slopcorpLogo from "../assets/slopcorp.png";
  import { fade } from "svelte/transition";

  type Props = {
    startPrompt: string;
    ecs: ECS;
  };
  let { startPrompt = "", ecs }: Props = $props();
  let prompt = $state(untrack(() => startPrompt));
  let started = false;

  let input: HTMLInputElement | undefined;

  const debug = new URLSearchParams(window.location.search).has("debug");
  const { createLLM } = mockLLM(
    [
      '```tool_code\ntravelTo(room="office")\n```',
      "I've gone to the office.",
      '```tool_code\ntravelTo(room="storage")\n```',
      "I've gone to the storage room.",
      '```tool_code\npickUp(item="paper")\n```',
      "I'm now carrying the paper.",
      '```tool_code\ntravelTo(room="office")\n```',
      "I've gone back to the office.",
      '```tool_code\nplaceItem(item="paper",target="printer")\n```',
      "We won!",
    ],
    500,
  );

  let chat = $derived(
    new Conversation(
      `
You are a helpful robot participating in a computer game.
The robot is owned by the SlopCorp company.

Your goal is to help the user achieve its goal by calling by using the available tools.
When the user is asking for information, use the information you've gathered with tools and give a clear answer.

- Before calling a tool describe the goal of that action friendly but succinctly without mentioning the name of the tool itself
- Don't make the exact same toolcall you've made in the previous message.
- tool_code format is using Python, for example: toolName(parameter="value")
- When describing action, use regular language, for example instead of "I can use the pickUp tool" say "I can pick up a item"
- Only call tools when they are relevant to the user's prompt

Syntax examples of tool calls:

\`\`\`tool_code
getRooms()
\`\`\`

\`\`\`tool_code
travelTo(room="name_of_the_room")
\`\`\`


`,
      [
        getRoomsTool(ecs),
        travelToTool(ecs),
        getInventoryTool(ecs),
        pickUpTool(ecs),
        lookAtTool(ecs),
        placeItemTool(ecs),
      ],
      debug ? createLLM : undefined,
      () => {
        if (ecs.gameHook) {
          const { delay = 0, message } = ecs.gameHook;
          ecs.gameHook = undefined;
          return new Promise((resolve) =>
            setTimeout(() => resolve(message), delay),
          );
        }
        return Promise.resolve(undefined);
      },
    ),
  );
  let controller: AbortController | undefined;
  let messages: ChatMessage[] = $derived([
    {
      role: "assistant",
      content: `Hi 👋,\nI'm a robot from SlopCorp — How can i help you?\n\nSay for example: "Go to the ${ecs.getRooms()[0].name}"`,
    },
    ...chat.messages,
    ...(chat.concept ? [chat.concept] : []),
  ]);
</script>

<svelte:window
  on:keydown={(e) => {
    if (e.key === "Escape") {
      controller?.abort();
    }
  }}
/>
<div
  class="mt-2 flex items-center rounded-t-2xl border border-b-0 border-panel-border bg-panel-background px-2.5 py-1 font-semibold text-white/80 [text-box-trim:trim-both]"
>
  <img src={slopcorpLogo} alt="SlopCorp" class="mr-4 h-11" />

  <div class="-mt-1 text-lg font-normal italic">
    Test your prompting skills!
  </div>
  {#if chat.thinking && (!chat.concept || chat.concept.content === "")}
    <div
      in:fade={{ duration: 200, delay: 400 }}
      class="ml-auto animate-pulse text-xs"
    >
      ...thinking
    </div>
  {/if}
</div>
<AutoScroll detect={messages.length + (chat.concept?.content.length ?? 0)}>
  <div class="flex w-full flex-col pt-5 pr-3 pl-16">
    {#each messages as message, i (i)}
      {#if message.role === "error"}
        <div
          class="mb-1 max-w-fit rounded-sm bg-orange-800 px-2 py-1 text-xs font-medium text-white"
          title={message.retry}
        >
          {message.content}
        </div>
      {:else if message.role === "tool"}
        <div
          class="mb-1 max-w-fit rounded-sm text-xs text-white {message.toolStatus ===
          'failed'
            ? 'bg-amber-700'
            : 'bg-teal-700'} px-2 py-1 leading-snug font-medium"
          title={message.content || message.retry}
        >
          {message.toolCall?.action}({JSON.stringify(
            message.toolCall?.parameters,
          )})
        </div>
      {:else}
        <div
          class="relative flex gap-1 {message.role === 'user'
            ? 'self-end'
            : 'self-start'}"
        >
          {#if message.role === "assistant"}
            <img
              src={avatar}
              alt="robot avatar"
              class="absolute -top-3 -left-13 size-10 rounded-sm"
            />
          {/if}
          <pre
            class={`mb-4 min-h-7 max-w-md rounded-2xl px-4 py-2 font-sans leading-snug whitespace-pre-wrap ${
              message.role === "user"
                ? "ml-4 rounded-br-xs bg-imessage-blue text-white"
                : "mr-4 rounded-tl-xs bg-lightgray text-sm text-black"
            }`}>{message.content}</pre>
        </div>
      {/if}
    {/each}
  </div>
</AutoScroll>
<form
  class="flex rounded-b-2xl bg-lightgray px-3 py-3"
  onsubmit={async (e) => {
    e.preventDefault();
    if (controller) {
      controller.abort();
      controller = undefined;
      return;
    }

    controller = new AbortController();
    const signal = controller.signal;
    if (!started) {
      ecs.start();
      started = true;
    }
    const promise = chat.prompt(prompt, { signal });
    prompt = "";
    input?.focus();
    await promise;
    if (controller?.signal === signal) {
      controller = undefined;
    }
  }}
>
  <!-- svelte-ignore a11y_autofocus -->
  <input
    bind:this={input}
    bind:value={prompt}
    autofocus
    placeholder={chat.thinking
      ? "Press ESC to cancel"
      : "Send an instruction to the robot"}
    class="grow rounded-l-full border border-r-0 border-gray-400 bg-white px-4 py-2 text-black outline-none focus:border-imessage-blue"
  />
  <button
    type="submit"
    class="cursor-pointer rounded-r-full bg-imessage-blue p-2 pr-3.5 pl-3 font-medium text-white"
  >
    Send
  </button>
</form>

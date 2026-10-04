<script lang="ts">
  import DownloadOverlay from "./DownloadOverlay.svelte";
  import Chat from "./Chat.svelte";
  import type ECS from "../ecs/ECS";

  type Props = {
    ecs: ECS;
  };
  let { ecs }: Props = $props();
  const testPrompts = {
    empty: "",
    fix: "Fix the printer issue",
    game: "Play the game",
    paper: "The printer needs paper",
  };
</script>

<DownloadOverlay>
  <Chat {ecs} startPrompt={testPrompts.empty} />
</DownloadOverlay>

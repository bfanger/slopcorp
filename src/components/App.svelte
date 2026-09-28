<script lang="ts">
  import PrinterScene, { createLevel1 } from "../scenes/PrinterScene";
  import DownloadOverlay from "./DownloadOverlay.svelte";
  import Chat from "./Chat.svelte";
  import type { Game } from "phaser";

  type Props = {
    game: Game;
  };
  let { game }: Props = $props();
  const testPrompts = {
    fix: "Fix the printer issue",
    game: "Play the game",
    paper: "The printer needs paper",
  };
</script>

<DownloadOverlay>
  <Chat
    startPrompt={testPrompts.paper}
    createLevel={createLevel1(game.scene.getScene("printer") as PrinterScene)}
  />
</DownloadOverlay>

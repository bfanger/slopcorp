<script lang="ts">
  import { createLevel1 } from "../scenes/Level1";
  import DownloadOverlay from "./DownloadOverlay.svelte";
  import Game from "./Game.svelte";

  const testPrompts = {
    fix: "Fix the printer issue",
    game: "Play the game",
    paper: "The printer needs paper",
  };
</script>

<DownloadOverlay>
  <Game startPrompt={testPrompts.paper} createLevel={createLevel1} />
</DownloadOverlay>

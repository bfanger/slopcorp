<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  type Props = {
    children: Snippet;
  };
  let { children }: Props = $props();

  let availability = $state<
    "unavailable" | "downloadable" | "downloading" | "available"
  >();
  let progress = $state(0);
  const options: Parameters<typeof LanguageModel.create>[0] = {
    samplingMode: "predictable",
    expectedInputs: [{ type: "text", languages: ["en"] }],
    expectedOutputs: [{ type: "text", languages: ["en"] }],
  };
  async function download() {
    const session = await LanguageModel.create({
      ...options,
      monitor(monitor) {
        monitor.addEventListener("downloadprogress", (e) => {
          progress = e.loaded;
        });
      },
    });
    session.destroy();
    availability = "available";
  }
  onMount(async () => {
    try {
      availability = await LanguageModel.availability(options);
      if (availability === "downloading") {
        await download();
      }
    } catch (err) {
      console.warn(err);
      availability = "unavailable";
    }
  });
</script>

{#if availability === "unavailable"}
  This browser doesn't have a local ai feature enabled.<br />
  Use Google Chrome and enable the "AI on device" feature in settings on a powerful
  enough PC.
{:else if availability === "downloadable"}
  <button
    class="rounded-full bg-orange-800 p-4 font-semibold text-white"
    onclick={download}
  >
    Download AI model (a couple of GB)
  </button>
{:else if availability === "downloading"}
  <div>
    <progress value={progress} max={1}></progress>
    {Math.floor(progress * 100)}%
  </div>
  This could take a while...
{:else}
  {@render children()}
{/if}

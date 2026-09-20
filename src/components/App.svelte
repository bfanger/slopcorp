<script lang="ts">
  let prompt = $state("Say hi");
  let chat = $state("");
  let thinking = $state(false);
  async function go() {
    thinking = true;
    try {
      const llm = await LanguageModel.create({
        samplingMode: "predictable",
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
        initialPrompts: [
          {
            role: "system",
            content:
              "You are a helpful assistant in service of the SlopCorp company",
          },
        ],
      });
      chat += prompt + "\n\n";
      const promise = llm.prompt(prompt);
      prompt = "";
      chat += await promise;
      console.log({ response: chat });
    } finally {
      thinking = false;
    }
  }
</script>

<input bind:value={prompt} on:keydown={(e) => e.key === "Enter" && go()} />
{#if thinking}Thinking...{/if}
<pre>{chat}</pre>

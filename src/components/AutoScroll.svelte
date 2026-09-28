<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    children: Snippet;
    count: number;
    height?: string;
  };
  let { children, count, height = "h-96" }: Props = $props();

  let el: HTMLElement | null = null;
  let autoScroll = $state(true);

  $effect(() => {
    count;
    if (autoScroll && el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  });

  function onScroll() {
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    autoScroll = distanceFromBottom <= 10;
  }
</script>

<div
  bind:this={el}
  class="overflow-y-auto overscroll-contain p-1 {height}"
  onscroll={onScroll}
>
  {@render children()}
</div>

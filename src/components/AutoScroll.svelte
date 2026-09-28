<script lang="ts">
  import { untrack, type Snippet } from "svelte";

  type Props = {
    children: Snippet;
    detect: number;
  };
  let { children, detect }: Props = $props();

  let enabled = $state(true);
  let lastScrollTop = 0;
</script>

<div
  class="grow overflow-y-scroll overscroll-contain bg-white p-1 text-gray-900"
  onscroll={(e) => {
    const el = e.currentTarget;
    const delta = el.scrollTop - lastScrollTop;
    lastScrollTop = el.scrollTop;
    if (delta < 0) {
      enabled = false;
    }
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    if (distanceFromBottom < 10 && untrack(() => enabled) === false) {
      enabled = true;
    }
  }}
  {@attach (el: HTMLDivElement) => {
    if (!Number.isNaN(detect) && enabled) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }}
>
  {@render children()}
</div>

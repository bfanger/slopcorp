// @ts-check
import { existsSync } from "node:fs";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const inDocker = existsSync("/.dockerenv");

export default defineConfig({
  plugins: [svelte({ compilerOptions: { experimental: { async: true } } })],
  server: {
    host: inDocker ? true : undefined,
    watch: {
      usePolling: inDocker,
      ignored: ["**/.svelte-check/**"],
    },
  },
});

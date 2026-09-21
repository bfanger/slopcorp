// @ts-check
import { existsSync } from "node:fs";
/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const inDocker = existsSync("/.dockerenv");

export default defineConfig({
  plugins: [svelte({ compilerOptions: { experimental: { async: true } } }), tailwindcss()],
  server: {
    host: inDocker ? true : undefined,
    watch: {
      usePolling: inDocker,
      ignored: ["**/.svelte-check/**"],
    },
  },
  test: {
    environment: "jsdom",
  },
  resolve: {
    alias: [
      {
        find: /^svelte$/,
        replacement: fileURLToPath(
          new URL("./node_modules/svelte/src/index-client.js", import.meta.url),
        ),
      },
    ],
  },
});

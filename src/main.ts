import Phaser from "phaser";
import { mount } from "svelte";
import App from "./components/App.svelte";
import "./styles.css";
import PrinterScene from "./scenes/PrinterScene";

export const game = new Phaser.Game({
  type: Phaser.WEBGL,
  width: 640,
  height: 480,
  scene: [PrinterScene],
  canvas: document.querySelector("canvas")!,
});
game.events.on("ready", () => {
  mount(App, {
    target: document.querySelector("svelte-app")!,
    props: { game },
  });
});
(globalThis as any).__PHASER_GAME__ = game;

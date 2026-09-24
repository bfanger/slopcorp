import Phaser from "phaser";
import { mount } from "svelte";
import App from "./components/App.svelte";
import "./styles.css";
import Level1 from "./scenes/Level1";

export const game = new Phaser.Game({
  type: Phaser.WEBGL,
  width: 640,
  height: 480,
  scene: [Level1],
  canvas: document.querySelector("canvas")!,
});

export const app = mount(App, {
  target: document.querySelector("svelte-app")!,
});

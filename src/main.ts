import Phaser from "phaser";
import { mount } from "svelte";
import App from "./components/App.svelte";
import MainScene from "./scenes/MainScene";

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  width: 640,
  height: 480,
  scene: [MainScene],
  canvas: document.querySelector("canvas")!,
});

const app = mount(App, { target: document.querySelector("svelte-app")! });

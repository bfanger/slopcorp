import Phaser from "phaser";
import { mount } from "svelte";
import App from "./components/App.svelte";
import "./styles.css";
import MainScene, { createLevel1 } from "./scenes/MainScene";

const ecs = createLevel1();

async function main() {
  // Ensure Roboto is loaded before Phaser renders any text
  await document.fonts.load("400 16px Roboto");

  const game = new Phaser.Game({
    type: Phaser.WEBGL,
    width: 1280,
    height: 960,
    backgroundColor: "040d26",
    scene: [MainScene],
    canvas: document.querySelector("canvas")!,
  });

  game.events.on("ready", () => {
    const scene: MainScene = game.scene.getScene("main") as MainScene;
    scene.connect(ecs);
    mount(App, {
      target: document.querySelector("svelte-app")!,
      props: { ecs },
    });
  });
  (globalThis as any).__PHASER_GAME__ = game;
}

void main();

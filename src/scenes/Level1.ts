import Phaser from "phaser";
import ECS, { createLocation } from "../ecs/ECS";

export default class Level1 extends Phaser.Scene {
  ecs!: ECS;
  private labels: Phaser.GameObjects.Text[] = [];
  private sprites: Phaser.GameObjects.Sprite[] = [];

  constructor() {
    super("Level1");
  }

  preload() {
    this.load.image("storage", "src/assets/storage.jpg");
    this.load.image("office", "src/assets/office.jpg");
  }

  create() {
    this.reset();
  }

  reset() {
    for (const g of this.labels) {
      g.destroy();
    }
    this.labels = [];
    for (const s of this.sprites) {
      s.destroy();
    }
    this.sprites = [];
    const displayW = 320;
    const storage = this.add.sprite(480, 240, "storage");
    const office = this.add.sprite(160, 240, "office");
    storage.setScale(displayW / storage.width);
    office.setScale(displayW / office.width);
    this.sprites.push(storage, office);
    this.ecs = createLevel1(() => undefined);
  }
}

export function createLevel1(onSuccess: () => void): ECS {
  return new ECS(
    [
      ...createLocation("office", [{ name: "printer", locked: "paper" }]),
      ...createLocation("cupboard", [{ name: "paper", portable: true }]),
    ],
    {
      unlocked(item) {
        if (item.name === "printer") {
          onSuccess();
        }
      },
    },
  );
}

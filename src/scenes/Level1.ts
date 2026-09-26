import Phaser from "phaser";
import ECS, { createLocation } from "../ecs/ECS";

export default class Level1 extends Phaser.Scene {
  ecs!: ECS;
  private labels: Phaser.GameObjects.Text[] = [];

  constructor() {
    super("Level1");
  }

  create() {
    this.reset();
  }

  reset() {
    for (const g of this.labels) {
      g.destroy();
    }
    this.labels = [];
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

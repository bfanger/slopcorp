import Phaser from "phaser";
import type { Entity, Location } from "../ecs/Entity";

const OFFICE = "officeFloor";
const CUPBOARD = "storageCupboard";

export default class Level1 extends Phaser.Scene {
  entities: Entity[] = [];
  private labels: Phaser.GameObjects.Text[] = [];

  constructor() {
    super("Level1");
  }

  create() {
    this.reset();
  }

  private label(x: number, y: number, text: string): Phaser.GameObjects.Text {
    const g = this.add.text(x, y, text, { fontSize: "14px", color: "#ffffff" });
    g.setOrigin(0.5, 0);
    this.labels.push(g);
    return g;
  }

  private entity(
    name: string,
    description: () => string,
    location: Location,
    x: number,
    y: number,
  ): Entity {
    const e: Entity = { name, description, location };
    this.label(x, y, name);
    this.entities.push(e);
    return e;
  }

  reset(): Entity[] {
    for (const g of this.labels) {
      g.destroy();
    }
    this.labels = [];
    this.entities = [];

    return this.entities;
  }
}

export function createEntities(): Entity[] {
  const office: Location = {
    type: "location",
    name: "office",
  };
  const cupboard: Location = {
    type: "location",
    name: "cupboard",
  };
  return [
    {
      name: "robot",
    },
    {
      name: "printer",
      location: office,
    },
    {
      name: "paper",
      location: cupboard,
    },
  ];
}

import Phaser from "phaser";
import ECS, { createLocation } from "../ecs/ECS";
import type { Room } from "../ecs/Entity";
import OfficeRoom from "./OfficeRoom";
import StorageRoom from "./StorageRoom";
import IntroGraphic from "../objects/IntroGraphic";
import WarningGraphic from "../objects/WarningGraphic";
import LocationsPanel from "./LocationsPanel";

export default class MainScene extends Phaser.Scene {
  private activeRoom = "";
  private rooms: Record<string, OfficeRoom | StorageRoom> = {};
  private locationsPanel!: LocationsPanel;
  private ecs!: ECS;

  constructor() {
    super("main");
  }

  preload() {
    OfficeRoom.preload(this);
    StorageRoom.preload(this);
    IntroGraphic.preload(this);
    WarningGraphic.preload(this);
    LocationsPanel.preload(this);
  }

  create() {
    if (!this.ecs) {
      throw new Error("ECS not connected");
    }
    const office = new OfficeRoom(this);
    office.connect(this.ecs);
    const storage = new StorageRoom(this);
    this.add.existing(office);
    this.add.existing(storage);
    this.rooms = { office, storage };
    this.locationsPanel = new LocationsPanel(this);
    this.locationsPanel.connect(this.ecs);
    this.add.existing(this.locationsPanel);
    const intro = new IntroGraphic(this);
    intro.connect(this.ecs);
    this.add.existing(intro);
  }

  traveled(room: Room) {
    if (this.activeRoom === room.name) {
      return;
    }
    const to = this.rooms[room.name];
    const from = this.rooms[this.activeRoom];

    to.intro();
    if (from) {
      from.outro();
    }
    this.activeRoom = room.name;
    this.locationsPanel.traveled(room.name);
  }

  won() {
    (this.rooms.office as OfficeRoom).won();
    const victory = this.add.text(
      this.game.scale.gameSize.width / 2,
      this.game.scale.gameSize.height / 2 + 100,
      "Mission successful!",
      {
        fontSize: "96px",
        fontStyle: "bold",
        align: "center",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
      },
    );
    victory.setAlpha(0);
    victory.setOrigin(0.5, 0.5);
    this.tweens.add({
      targets: victory,
      alpha: 1,
      y: this.game.scale.gameSize.height / 2,
      duration: 600,
    });
  }
  connect(ecs: ECS) {
    this.ecs = ecs;

    ecs.addEventListener("unlocked", ({ item }) => {
      if (item.name === "printer") {
        this.won();
        ecs.gameHook = {
          message: "Level complete! The printer issue is fixed",
          delay: 1000,
        };
      }
    });
    ecs.addEventListener("traveled", ({ room }) => {
      ecs.delay(1500);
      this.traveled(room);
    });
    ecs.addEventListener("pickup", () => ecs.delay(1000));
  }
}

export function createLevel1() {
  return new ECS([
    ...createLocation("office", [
      {
        name: "printer",
        description: (e) => {
          if (e.getEntity("printer").locked) {
            return "White all-in-one printer, the display is showing a warning 'Out of paper'";
          }
          return "White all-in-one printer with paper trays, in full working order";
        },
        locked: "paper",
      },
      { name: "keyboard", description: "Black keyboard on a wooden desk" },
      { name: "monitor", description: "Computer monitor on a wooden desk" },
      { name: "mouse", description: "Black mouse next to the keyboard" },
      {
        name: "penholder",
        description: "Blue cup holding pens and pencils",
      },
      {
        name: "desk",
        description:
          "Mostly empty office desk, on it are a monitor, a keyboard and some pens",
      },
      { name: "chair", description: "Black office chair with wheels" },
      { name: "plant", description: "Potted plant in a terracotta pot" },
      { name: "window", description: "Window with blinds" },
    ]),
    ...createLocation("storage", [
      {
        name: "paper",
        description: "Stack of paper, suitable for printers",
        portable: true,
      },
      { name: "pens", description: "Box of pens" },
      { name: "cabinet", description: "Cabinet" },
      {
        name: "vendingmachine",
        description: "Vending machine with assorted snacks",
      },
    ]),
  ]);
}

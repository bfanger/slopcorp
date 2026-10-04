import Phaser from "phaser";
import ECS, { createLocation } from "../ecs/ECS";
import type { Room } from "../ecs/Entity";
import avatarAsset from "../assets/handdrawn/avatar.png";
import OfficeRoom from "./OfficeRoom";
import StorageRoom from "./StorageRoom";
import IntroGraphic from "../objects/IntroGraphic";
import WarningGraphic from "../objects/WarningGraphic";

export default class MainScene extends Phaser.Scene {
  private labels: Phaser.GameObjects.Text[] = [];
  private activeRoom: string | null = null;
  private rooms: Record<string, OfficeRoom | StorageRoom> = {};
  private roomLabels: Record<string, Phaser.GameObjects.Text> = {};
  private avatar!: Phaser.GameObjects.Sprite;
  private intro!: IntroGraphic;

  constructor() {
    super("main");
  }

  preload() {
    this.load.image("avatar", avatarAsset);
    OfficeRoom.preload(this);
    StorageRoom.preload(this);
    IntroGraphic.preload(this);
    WarningGraphic.preload(this);
  }

  create() {
    const office = new OfficeRoom(this);
    const storage = new StorageRoom(this);
    this.add.existing(office);
    this.add.existing(storage);
    this.rooms = { office, storage };
    this.reset();
  }

  reset() {
    for (const g of this.labels) {
      g.destroy();
    }
    this.labels = [];
    if (this.avatar) {
      this.avatar.destroy();
    }
    if (this.intro) {
      this.intro.destroy();
    }
    const locationsLabel = this.add.text(980, 320, "Locations:", {
      fontSize: "40px",
    });
    locationsLabel.setOrigin(0, 0.5);
    const officeLabel = this.add.text(980, 390, "office", {
      fontSize: "32px",
    });
    officeLabel.setOrigin(0, 0.5);
    const storageLabel = this.add.text(980, 460, "storage", {
      fontSize: "32px",
    });
    storageLabel.setOrigin(0, 0.5);
    this.labels.push(locationsLabel, officeLabel, storageLabel);
    this.roomLabels = { office: officeLabel, storage: storageLabel };
    const avatar = this.add.sprite(
      480,
      this.game.scale.gameSize.height / 2,
      "avatar",
    );
    avatar.setOrigin(0.5, 0.5);
    avatar.setScale(8);
    avatar.texture.setSmoothPixelArt(true);
    this.avatar = avatar;
    const intro = new IntroGraphic(this);
    this.add.existing(intro);
    this.intro = intro;
  }

  started() {
    if (!this.intro.isDestroyed) {
      this.intro.outro();
    }
  }

  moveToRoom(room: Room) {
    if (this.activeRoom === room.name) {
      return;
    }
    const to = this.rooms[room.name];
    to.fade(1, 400);
    if (this.activeRoom !== null) {
      const from = this.rooms[this.activeRoom];
      from.fade(0, 650);
    }
    this.activeRoom = room.name;
    const label = this.roomLabels[room.name];
    if (label) {
      this.tweens.add({
        targets: this.avatar,
        x: this.game.scale.gameSize.width - 100,
        y: label.y,
        scaleX: 1,
        scaleY: 1,
        duration: 400,
      });
    }
    for (const [name, roomLabel] of Object.entries(this.roomLabels)) {
      roomLabel.setStyle({ fontStyle: name === room.name ? "bold" : "" });
    }
  }

  won() {
    if (this.activeRoom === "office") {
      (this.rooms.office as OfficeRoom).warning.stopAndHide();
    }
    if (this.activeRoom) {
      this.tweens.add({
        targets: this.rooms[this.activeRoom].background,
        alpha: 0.3,
        duration: 1000,
      });
    }
    this.tweens.add({
      targets: this.avatar,
      x: 480,
      y: this.game.scale.gameSize.height / 2,
      scaleX: 8,
      scaleY: 8,
      duration: 400,
    });
    const victory = this.add.text(
      this.game.scale.gameSize.width / 2,
      40,
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
    victory.setOrigin(0.5, 0);
    victory.setAlpha(0);
    this.tweens.add({ targets: victory, alpha: 1, duration: 600 });
    this.labels.push(victory);
  }
  connect(ecs: ECS) {
    ecs.addEventListener("started", () => {
      this.started();
      ecs.delay(500);
    });
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
      this.moveToRoom(room);
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

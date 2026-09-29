import Phaser from "phaser";
import ECS, { createLocation, type GameEvent } from "../ecs/ECS";
import type { Room } from "../ecs/Entity";
import storageAsset from "../assets/storage.jpg";
import officeAsset from "../assets/office.jpg";
import avatarAsset from "../assets/handdrawn/avatar.png";
import WarningGraphic from "../objects/WarningGraphic";

export default class PrinterScene extends Phaser.Scene {
  ecs!: ECS;
  private labels: Phaser.GameObjects.Text[] = [];
  private rooms: Phaser.GameObjects.Sprite[] = [];
  private roomLabels: Record<string, Phaser.GameObjects.Text> = {};
  private avatar!: Phaser.GameObjects.Sprite;
  private warning!: WarningGraphic;
  private printerFixed = false;

  constructor() {
    super("printer");
  }

  preload() {
    this.load.image("storage", storageAsset);
    this.load.image("office", officeAsset);
    this.load.image("avatar", avatarAsset);
    WarningGraphic.preload(this);
  }

  create() {
    this.reset();
  }

  reset() {
    for (const g of this.labels) {
      g.destroy();
    }
    this.labels = [];
    for (const s of this.rooms) {
      s.destroy();
    }
    this.rooms = [];
    if (this.avatar) {
      this.avatar.destroy();
    }
    if (this.warning) {
      this.warning.destroy();
    }
    const displayH = this.game.scale.gameSize.height;
    const storage = this.add.sprite(0, 0, "storage");
    const office = this.add.sprite(0, 0, "office");
    storage.setOrigin(0, 0);
    office.setOrigin(0, 0);
    storage.setScale(displayH / storage.height);
    office.setScale(displayH / office.height);
    storage.setAlpha(0.05);
    office.setAlpha(0.05);
    this.rooms.push(storage, office);
    const locationsLabel = this.add.text(490, 160, "Locations:", {
      fontSize: "20px",
    });
    locationsLabel.setOrigin(0, 0.5);
    const officeLabel = this.add.text(490, 195, "office", {
      fontSize: "16px",
    });
    officeLabel.setOrigin(0, 0.5);
    const storageLabel = this.add.text(490, 230, "storage", {
      fontSize: "16px",
    });
    storageLabel.setOrigin(0, 0.5);
    this.labels.push(locationsLabel, officeLabel, storageLabel);
    this.roomLabels = { office: officeLabel, storage: storageLabel };
    const avatar = this.add.sprite(
      240,
      this.game.scale.gameSize.height / 2,
      "avatar",
    );
    avatar.setOrigin(0.5, 0.5);
    avatar.setScale(4);
    avatar.texture.setSmoothPixelArt(true);
    this.avatar = avatar;
    const warning = new WarningGraphic(this, 80, 220);
    this.add.existing(warning);
    warning.startWobble();
    this.warning = warning;
  }

  moveToRoom(room: Room) {
    for (const s of this.rooms) {
      this.tweens.add({ targets: s, alpha: 0, duration: 400 });
    }
    const target = this.rooms.find((s) => s.texture.key === room.name);
    if (target) {
      this.tweens.add({
        targets: target,
        alpha: 1,
        duration: 400,
        delay: 250,
      });
    }
    if (this.warning) {
      if (room.name === "office" && !this.printerFixed) {
        this.warning.show();
      } else {
        this.warning.hide();
      }
    }
    const label = this.roomLabels[room.name];
    if (label) {
      this.tweens.add({
        targets: this.avatar,
        x: this.game.scale.gameSize.width - 50,
        y: label.y,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 400,
      });
    }
    for (const [name, roomLabel] of Object.entries(this.roomLabels)) {
      roomLabel.setStyle({ fontStyle: name === room.name ? "bold" : "" });
    }
  }

  won() {
    this.printerFixed = true;
    this.warning?.stopAndHide();
    const current = this.rooms.find((s) => s.alpha > 0);
    if (current) {
      this.tweens.add({ targets: current, alpha: 0.3, duration: 1000 });
    }
    this.tweens.add({
      targets: this.avatar,
      x: 240,
      y: this.game.scale.gameSize.height / 2,
      scaleX: 4,
      scaleY: 4,
      duration: 400,
    });
    const victory = this.add.text(
      this.game.scale.gameSize.width / 2,
      20,
      "Mission successful!",
      {
        fontSize: "48px",
        fontStyle: "bold",
        align: "center",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );
    victory.setOrigin(0.5, 0);
    victory.setAlpha(0);
    this.tweens.add({ targets: victory, alpha: 1, duration: 600 });
    this.labels.push(victory);
  }
}

export function createLevel1(scene: PrinterScene) {
  return (onEvent: (event: GameEvent) => void) =>
    new ECS(
      [
        ...createLocation("office", [
          {
            name: "printer",
            description: (ecs) => {
              if (ecs.getEntity("printer").locked) {
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
      ],
      {
        unlocked(item) {
          if (item.name === "printer") {
            scene.won();
            onEvent({
              message: "Level complete! The printer issue is fixed",
              delay: 1000,
            });
          }
        },
        moved(room) {
          onEvent({ delay: 1500 });
          scene.moveToRoom(room);
        },
        pickup() {
          onEvent({ delay: 1000 });
        },
      },
    );
}

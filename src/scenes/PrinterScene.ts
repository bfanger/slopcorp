import Phaser from "phaser";
import ECS, { createLocation, type GameEvent } from "../ecs/ECS";
import type { Room } from "../ecs/Entity";

export default class PrinterScene extends Phaser.Scene {
  ecs!: ECS;
  private labels: Phaser.GameObjects.Text[] = [];
  private rooms: Phaser.GameObjects.Sprite[] = [];
  private roomLabels: Record<string, Phaser.GameObjects.Text> = {};
  private avatar!: Phaser.GameObjects.Sprite;

  constructor() {
    super("printer");
  }

  preload() {
    this.load.image("storage", "src/assets/storage.jpg");
    this.load.image("office", "src/assets/office.jpg");
    this.load.image("avatar", "src/assets/handdrawn/avatar.png");
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
      fontSize: "16px",
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
      this.game.scale.gameSize.width / 2,
      this.game.scale.gameSize.height / 2,
      "avatar",
    );
    avatar.setOrigin(0.5, 0.5);
    avatar.setScale(3);
    this.avatar = avatar;
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
}

export function createLevel1(scene: PrinterScene) {
  return (onEvent: (event: GameEvent) => void) =>
    new ECS(
      [
        ...createLocation("office", [{ name: "printer", locked: "paper" }]),
        ...createLocation("storage", [{ name: "paper", portable: true }]),
      ],
      {
        unlocked(item) {
          if (item.name === "printer") {
            onEvent({ message: "The printer issue is fixed!" });
          }
        },
        moved(room) {
          onEvent({ delay: 700 });
          scene.moveToRoom(room);
        },
      },
    );
}

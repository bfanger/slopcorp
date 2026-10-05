import Phaser from "phaser";
import avatarAsset from "../assets/handdrawn/avatar.png";
import type ECS from "../ecs/ECS";
import Tooltip from "../objects/Tooltip";

export default class LocationsPanel extends Phaser.GameObjects.Container {
  private labels: Record<string, Phaser.GameObjects.Text> = {};
  private tooltip: Tooltip;
  private avatar!: Phaser.GameObjects.Sprite;
  private currentRoom?: string;

  constructor(scene: Phaser.Scene) {
    super(scene, 990, 80);
    const title = scene.add.text(0, 0, "Locations", {
      fontSize: "40px",
      fontFamily: "Roboto",
    });
    title.setOrigin(0, 0.5);
    this.add(title);
    this.avatar = scene.add.sprite(200, 80, "avatar");
    this.avatar.setOrigin(0.5, 0.5);
    this.avatar.texture.setSmoothPixelArt(true);
    this.avatar.setScale(0);
    this.add(this.avatar);

    this.tooltip = new Tooltip(scene);
    this.tooltip.setDepth(1001);
    this.scene.add.existing(this.tooltip);
  }

  private showTooltip(label: Phaser.GameObjects.Text, room: string) {
    const tip =
      room === this.currentRoom
        ? `Type: What items are in this room?`
        : `Type: Go to the ${room} room`;
    this.tooltip.show(tip, this.x + label.width / 2, this.y + label.y - 20);
  }

  private hideTooltip() {
    this.tooltip.hide();
  }

  traveled(room: string) {
    this.currentRoom = room;
    for (const [name, label] of Object.entries(this.labels)) {
      label.setStyle({ fontStyle: name === room ? "bold" : "" });
    }
    const labelY = this.labels[room]?.y;
    if (labelY !== undefined) {
      this.scene.tweens.add({
        targets: this.avatar,
        y: labelY,
        scale: 1,
        duration: 400,
      });
    }
  }

  connect(ecs: ECS) {
    ecs.getRooms().forEach((room, index) => {
      const label = this.scene.add.text(0, 80 + index * 70, room.name, {
        fontSize: "32px",
        fontFamily: "Roboto",
      });
      label.setOrigin(0, 0.5);
      label.setInteractive();
      label.on("pointerover", () => this.showTooltip(label, room.name));
      label.on("pointerout", () => this.hideTooltip());
      this.labels[room.name] = label;
      this.add(label);
    });
    ecs.addEventListener("traveled", ({ room }) => {
      this.traveled(room.name);
    });
  }

  static preload(scene: Phaser.Scene) {
    scene.load.image("avatar", avatarAsset);
  }
}

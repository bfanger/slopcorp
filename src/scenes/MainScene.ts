import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  create() {
    const text = this.add.text(320, 240, "SlopCorp", { fontSize: "48px" });
    text.setOrigin(0.5, 0.5);
  }
}

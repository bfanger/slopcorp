import Phaser from "phaser";
import storageAsset from "../assets/storage.jpg";

export default class StorageRoom extends Phaser.GameObjects.Container {
  background!: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.background = scene.add.image(0, 0, "storage");
    this.background.setOrigin(0, 0);
    this.background.setScale(0.76);
    this.setAlpha(0);
    this.add(this.background);
  }

  fade(alpha: number, duration: number, delay = 0) {
    this.scene.tweens.add({ targets: this, alpha, duration, delay });
  }

  static preload(scene: Phaser.Scene) {
    scene.load.image("storage", storageAsset);
  }
}

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

  intro() {
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 400,
      delay: 500,
    });
  }

  outro() {
    this.scene.tweens.add({ targets: this, alpha: 0, duration: 400 });
  }

  static preload(scene: Phaser.Scene) {
    scene.load.image("storage", storageAsset);
  }
}

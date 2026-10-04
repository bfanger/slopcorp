import Phaser from "phaser";
import officeAsset from "../assets/office.jpg";
import WarningGraphic from "../objects/WarningGraphic";

export default class OfficeRoom extends Phaser.GameObjects.Container {
  background!: Phaser.GameObjects.Image;
  warning!: WarningGraphic;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.background = scene.add.image(0, 0, "office");
    this.background.setOrigin(0, 0);
    this.background.setScale(0.76);
    this.setAlpha(0);
    this.warning = new WarningGraphic(scene, 160, 440);
    this.warning.startWobble();
    this.warning.show();
    this.add([this.background, this.warning]);
  }

  fade(alpha: number, duration: number, delay = 0) {
    this.scene.tweens.add({ targets: this, alpha, duration, delay });
  }

  static preload(scene: Phaser.Scene) {
    scene.load.image("office", officeAsset);
  }
}

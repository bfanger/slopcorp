import Phaser from "phaser";
import warningAsset from "../assets/warning.png";

export default class WarningGraphic extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "warning");
    this.setScale(0);
  }

  startWobble() {
    this.anims.create({
      key: "wobble",
      defaultTextureKey: "warning",
      frames: this.anims.generateFrameNumbers("warning", {
        start: 0,
        end: 59,
      }),
      repeat: -1,
    });
    this.play("wobble");
  }

  show() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.4,
      scaleY: 0.4,
      duration: 400,
      delay: 250,
    });
    this.scene.tweens.add({
      targets: this,
      y: this.y - 10,
      duration: 600,
      yoyo: true,
      repeat: 3,
      ease: "Sine.easeInOut",
    });
  }

  hide() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      duration: 400,
    });
  }

  stopAndHide() {
    this.anims.stop();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      duration: 400,
    });
  }

  destroy(fromScene?: boolean) {
    this.scene.tweens.killTweensOf(this);
    super.destroy(fromScene);
  }

  static preload(scene: Phaser.Scene) {
    scene.load.spritesheet("warning", warningAsset, {
      frameWidth: 128,
      frameHeight: 128,
    });
  }
}

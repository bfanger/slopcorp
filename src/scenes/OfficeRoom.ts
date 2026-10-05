import Phaser from "phaser";
import officeAsset from "../assets/office.jpg";
import type ECS from "../ecs/ECS";
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
    this.add([this.background, this.warning]);
  }

  intro() {
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 400,
      delay: 500,
    });
    this.warning.show();
  }

  outro() {
    this.scene.tweens.add({ targets: this, alpha: 0, duration: 400 });
  }

  showVictory() {
    this.warning.stopAndHide();
    this.scene.tweens.add({
      targets: this.background,
      alpha: 0.3,
      duration: 1000,
    });
  }

  connect(ecs: ECS) {
    ecs.addEventListener("unlocked", ({ item }) => {
      if (item.name === "printer") {
        this.warning.stopAndHide();
      }
    });
    ecs.addEventListener("victory", () => this.showVictory());
  }

  static preload(scene: Phaser.Scene) {
    scene.load.image("office", officeAsset);
  }
}

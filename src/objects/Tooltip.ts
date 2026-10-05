import Phaser from "phaser";

const PAD_X = 12;
const PAD_Y = 8;
const RADIUS = 10;

export default class Tooltip extends Phaser.GameObjects.Container {
  private bubble: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.bubble = scene.add.graphics();
    this.text = scene.add.text(0, 0, "", {
      fontSize: "20px",
      fontFamily: "Roboto",
      color: "#2d2a26",
    });
    this.text.setOrigin(0.5);

    this.add(this.bubble);
    this.add(this.text);
    this.setVisible(false);
  }

  show(content: string, x: number, y: number) {
    this.text.setText(content);

    const w = this.text.width + PAD_X * 2;
    const h = this.text.height + PAD_Y * 2;
    const r = Math.min(RADIUS, h / 2);
    const g = this.bubble;

    g.clear();
    g.fillStyle(0xfff9ec);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    g.lineStyle(3, 0x2d2a26, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);

    // Anchor the bubble's bottom-center at (x, y)
    this.setPosition(x, y - h / 2);
    this.setVisible(true);
  }

  hide() {
    this.setVisible(false);
  }
}

import Phaser from "phaser";
import introAsset from "../assets/intro.jpg";
import dissolveNoiseAsset from "../assets/dissolve-noise.png";

const DISSOLVE_FRAGMENT = /* glsl */ `
precision mediump float;
varying vec2 outTexCoord;
uniform sampler2D uImage;
uniform sampler2D uNoise;
uniform float uProgress;

void main()
{
    vec4 color = texture2D(uImage, outTexCoord);
    float n = texture2D(uNoise, outTexCoord).r;
    float t = clamp(uProgress, 0.0, 1.0);
    float edge = 0.055;
    float keep = t <= 0.0 ? 1.0 : smoothstep(t, t + edge, n);
    float band = t <= 0.0 ? 0.0 : smoothstep(t - edge, t, n) * (1.0 - smoothstep(t, t + edge, n));
    vec3 glow = vec3(1.0, 0.75, 0.4);
    vec3 rgb = mix(color.rgb, glow, band);
    float alpha = keep * color.a;
    gl_FragColor = vec4(rgb * alpha, alpha);
}
`;

export default class IntroGraphic extends Phaser.GameObjects.Shader {
  private dissolve = { p: 0 };

  constructor(scene: Phaser.Scene) {
    const tex = scene.textures.get("intro");
    super(
      scene,
      {
        name: "introDissolve",
        fragmentSource: DISSOLVE_FRAGMENT,
        setupUniforms: (setUniform: (name: string, value: unknown) => void) => {
          setUniform("uImage", 0);
          setUniform("uNoise", 1);
          setUniform("uProgress", this.dissolve.p);
        },
      },
      500,
      480,
      tex.getSourceImage().width,
      tex.getSourceImage().height,
      ["intro", "dissolveNoise"],
    );
    this.setScale(0.84);
    this.setDepth(1000);
  }

  outro() {
    this.dissolve.p = 0;
    this.scene.tweens.add({
      targets: this.dissolve,
      ease: "Linear",
      p: 1,
      duration: 1500,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  static preload(scene: Phaser.Scene) {
    scene.load.image("intro", introAsset);
    scene.load.image("dissolveNoise", dissolveNoiseAsset);
  }
}

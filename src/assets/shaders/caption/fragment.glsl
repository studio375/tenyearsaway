precision highp float;

uniform sampler2D uMap;
uniform float uProgress;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Scale UV from center — caption inflates like balloon
  float p = max(uProgress, 0.001);
  vec2 scaledUv = (uv - 0.5) / p + 0.5;

  float inBounds = step(0.0, scaledUv.x) * step(scaledUv.x, 1.0)
                 * step(0.0, scaledUv.y) * step(scaledUv.y, 1.0);

  vec4 color = texture(uMap, scaledUv) * inBounds;

  if (color.a < 0.001) discard;

  gl_FragColor = color;

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}

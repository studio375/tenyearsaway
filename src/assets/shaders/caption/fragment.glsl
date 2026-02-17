uniform sampler2D uMap;
uniform sampler2D uDisplacement;
uniform float uProgress;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  vec4 color = texture(uMap, uv);
  float noise = texture(uDisplacement, uv).r;

  float edge = 0.1;
  float alpha = smoothstep(
    uProgress - edge,
    uProgress + edge,
    noise
  );

  color.a *= 1. - alpha;

  if (color.a < 0.001) discard;

  gl_FragColor = color;

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}

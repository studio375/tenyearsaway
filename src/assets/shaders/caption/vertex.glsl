precision mediump float;

uniform float uTime;
uniform float uVelocity;
uniform float uProgress;
uniform float uSeed;

varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;

  float progress = 1. - uProgress;
  pos.y += sin(pos.x * 3.20 + uSeed) * 0.2 * progress;
  pos.x += sin(uTime * 2.2 + uSeed * 6.0) * 0.03;

  vec4 wPos = modelMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wPos;
}
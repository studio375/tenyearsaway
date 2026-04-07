precision mediump float;

varying vec2 vUv;
varying vec3 vWorldPosition;
void main() {
  vUv = uv;
  vec4 wPos = (modelMatrix * vec4(position,1.0));
  vWorldPosition = wPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * wPos;
}
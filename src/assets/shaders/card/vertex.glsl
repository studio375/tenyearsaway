precision mediump float;

uniform float uScrollForce;
uniform float uTime;
uniform float uOffset;

varying vec2 vUv;
varying vec4 vClipPosition;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec3 pos = position;

  pos.z += cos(uv.x * 3.14159 + uTime * .45) * 0.1;
  pos.z += cos(uv.y * 3.14159 + uTime * .5) * 0.12;

  vec4 wPos = (modelMatrix * vec4(pos,1.0));
  vWorldPosition = wPos.xyz;
  vClipPosition = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wPos;

}
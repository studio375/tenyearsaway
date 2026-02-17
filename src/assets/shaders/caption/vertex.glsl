uniform float uTime;
uniform float uVelocity;
uniform float uProgress;
uniform float uSeed;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vUv = uv; 
  vNormal = (modelMatrix * vec4(normal,0.0)).xyz;
  vec3 pos = position;

  float progress = 1. - uProgress;
  pos.z += sin(pos.x * 2.20 + uSeed) * 0.2 * progress;
  pos.z += sin(pos.y * 5.20 + uSeed) * 0.2 * progress;

  pos.x += sin(uTime * 2.2 + uSeed * 6.0) * 0.03;

  vec4 wPos = (modelMatrix * vec4(pos,1.0));
  vWorldPosition = wPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * wPos;
}
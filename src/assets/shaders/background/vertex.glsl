uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vPosition;
void main() {
  vUv = uv;

  vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vNormal = worldNormal;

  vec3 pos = position;
  vec4 wPos = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = wPos.xyz;
  vPosition = pos;
  gl_Position = projectionMatrix * viewMatrix * wPos;
}

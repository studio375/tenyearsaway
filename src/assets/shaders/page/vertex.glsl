uniform float uTime;
uniform float uVelocity;
uniform float uProgress;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vUv = uv; 
  vNormal = (modelMatrix * vec4(normal,0.0)).xyz;
  vec3 pos = position; 
  
  float intensity = 1.0 - smoothstep(0.0, 1.0, uProgress);
  float curve = sin(vUv.x * 2. + 3.14 + 8.7 + uProgress * 3.0) * 5.14;
  float curve2 = sin(vUv.y * 3. + 6. + uProgress * 4.0) * 3.54;

  pos.z += curve * 0.2 * intensity;
  pos.z += 1.5 * intensity;
  pos.z += curve2 * .14 * 1. - intensity;
  pos.z += curve * -.05 * 1. - intensity;

  vec4 wPos = (modelMatrix * vec4(pos,1.0));
  vWorldPosition = wPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * wPos;
}
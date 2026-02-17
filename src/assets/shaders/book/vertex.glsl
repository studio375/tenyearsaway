uniform float uTime;
uniform float uVelocity;
uniform float uProgress;
uniform float uOpened;
uniform float uCurl;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;

  vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vNormal = worldNormal;

  vec3 pos = position;

  // se la pagina è girata, la normale cambia segno e quindi uvx si specchia
  float flip = step(0.0, worldNormal.z);
  float uvx = mix(vUv.x, 1.0 - vUv.x, flip);

  float spineWeight = position.x + 0.5; // 0 alla rilegatura

  float curve = sin(uvx * 2.0 + 3.141592 + uTime * 3.0) * 2.14;
  float stiffness = pow(uvx, 3.0);
  float totalZ = (curve * 0.2 * spineWeight) + (stiffness * 0.2 * spineWeight);

  // Muovo la pagina al click
  float curve2 = sin(uvx * 2.0 + uTime * 5.0) * 1.14;
  float curve3 = sin(vUv.y + 2. + uTime * 5.0) * 1.14;
  float exitZ = curve2 * curve3 * spineWeight * uCurl;

  pos.z += totalZ + exitZ;

  vec4 wPos = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = wPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * wPos;
}

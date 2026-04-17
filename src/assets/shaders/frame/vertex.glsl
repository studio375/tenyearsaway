precision mediump float;

uniform float uTime;
uniform float uVelocity;
uniform float uClipX;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec4 vClipPosition;


void main() {
  vUv = uv;
  vec3 pos = position;
  
  pos.z += sin(pos.y * 3.4 + uTime) * 0.08;
  pos.z += sin(pos.x * 3. + uTime ) * 0.08;

  // Curvatura entrata/uscita viewport: bend sull'asse X basato su posizione NDC
  float edgeCurve = smoothstep(0.2, 1.5, abs(uClipX));
  pos.z += sign(uClipX) * pos.x * pos.y * edgeCurve * 1.4;

  vec4 wPos = (modelMatrix * vec4(pos,1.0));
  vWorldPosition = wPos.xyz; 
  vClipPosition = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wPos;
}
#pragma glslify: falloff = require(../utils/functions.glsl)
#pragma glslify: cnoise = require(../utils/perlin.glsl)
#pragma glslify: fbm = require(../utils/fbm.glsl)
#pragma glslify: random = require(../utils/noise.glsl)

float hash(float n) { return fract(sin(n) * 1e4); }
float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

float noise(float x) {
	float i = floor(x);
	float f = fract(x);
	float u = f * f * (3.0 - 2.0 * f);
	return mix(hash(i), hash(i + 1.0), u);
}

uniform float uTime;
uniform float uSpeed;
uniform float uMovement;
uniform float uAlpha;
uniform vec2 uSizes;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vPosition;
void main() {
  vec2 uv = vec2(vUv);

  float alpha = .8;

  // vec3 stretchedPos = vWorldPosition;
  vec3 localPos = vec3((uv - 0.5) * uSizes, 0.0);     
  localPos.x += uMovement * 2.;
  // stretchedPos.y *= 1. + (10. * uSpeed);
  alpha *= fbm(localPos * vec3(.4,.8,1.) + vec3(uTime * .15, uTime * .3, 0.), 1);

  float fbmDiv = fbm(localPos * vec3(.4,.8 * 10.,1.), 3);
  float alphaWithFbm = alpha / fbmDiv / 6.; 
  alphaWithFbm = clamp(alphaWithFbm, 0.0, 1.0); 
  alphaWithFbm = pow(alphaWithFbm, 1.35); 
  float speedFactor = smoothstep(0.0, 0.4, uSpeed);
  alpha = mix(alpha, alphaWithFbm, speedFactor);
  alpha = pow(alpha, 2.); 
  //alpha *= 2.;

  vec3 color = vec3(0.1, 0.1, 0.1);

  gl_FragColor = vec4(color, alpha * uAlpha);
  
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
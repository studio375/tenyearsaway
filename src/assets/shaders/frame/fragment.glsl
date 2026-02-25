#pragma glslify: falloff = require(../utils/functions.glsl)
#pragma glslify: cnoise = require(../utils/perlin.glsl)

uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;
uniform sampler2D uMap;
uniform float uProgress;
uniform float uLightProgress;

varying vec2 vUv;
varying vec3 vWorldPosition;

mat2 rotate2d(float angle){
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}
float halftone(vec2 uv, float freq, float angle, float sizeMap) {
    vec2 rotatedUV = rotate2d(angle) * uv * freq;
    
    vec2 nearest = floor(rotatedUV + 0.5);
    vec2 distVec = rotatedUV - nearest;
    float dist = length(distVec);
    
    float radius = sqrt(sizeMap) * 0.6; 
    
    float dot = 1.0 - smoothstep(radius - 0.05, radius + 0.05, dist);
    
    return dot;
}

void main() {
  vec2 uv = vec2(vUv);

  // Texture di base
  vec4 color = texture(uMap, uv);
  vec3 baseColor = color.rgb;

  // Reveal
  float d = length(uv);
  d -= cnoise(vec4(vWorldPosition * uFrequency , uTime * 0.05)) * uAmplitude;
  float alphaReveal = falloff(d, -uAmplitude, 1.5 + uAmplitude, 0.5, uProgress);
  float alpha = color.a;
  alpha *= alphaReveal;
  
  // Dots
  float noiseSize = cnoise(vec4(vWorldPosition * 0.5, 1.0));
  float dotSizeMap = 0. + 0.8 * smoothstep(-.5, 1.0, noiseSize); 
  float dotPattern = halftone(vWorldPosition.xy, 19.0, .985, dotSizeMap);
  vec3 dots = vec3(dotPattern);
  float dotsReveal = 1. - falloff(d, -uAmplitude - 0.3, 1.5 + uAmplitude, .56, uProgress);
  dotsReveal = pow(dotsReveal, 2.0);
  baseColor += dots * 2. * dotsReveal;


  // Light
  vec3 light = vec3(0.8, 0.8, 1.);
  baseColor += light * uLightProgress;

  gl_FragColor = vec4(baseColor, alpha);
  
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
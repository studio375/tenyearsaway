precision mediump float;

#pragma glslify: falloff = require(../utils/functions.glsl)
#pragma glslify: cnoise = require(../utils/perlin.glsl)

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


uniform sampler2D uMap;
uniform sampler2D uTrailTexture;

varying vec2 vUv;
varying vec4 vClipPosition;
varying vec3 vWorldPosition;


void main() {
  vec2 uv = vec2(vUv);

  // Texture di base
  vec4 color = texture(uMap, uv);

  // Trail
  vec2 screenUv = (vClipPosition.xy / vClipPosition.w) * 0.5 + 0.5;
  float trailDensity = smoothstep(0.08, 0.4, texture2D(uTrailTexture, screenUv).r);
  float luma = dot(color.rgb, vec3(0.99, 0.9, 0.99));
  color.rgb = mix(color.rgb, vec3(luma + 0.95), trailDensity * 0.9);
  float dotpattern = halftone(vWorldPosition.xy, 16.0, .985, 0.2);
  color.rgb = mix(color.rgb, vec3(dotpattern), trailDensity * 0.55);

  gl_FragColor = vec4(color);
 
}
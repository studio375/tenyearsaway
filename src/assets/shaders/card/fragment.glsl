precision mediump float;

#pragma glslify: falloff = require(../utils/functions.glsl)
#pragma glslify: cnoise = require(../utils/perlin.glsl)


uniform sampler2D uMap;

varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vec2 uv = vec2(vUv);

  // Texture di base
  vec4 color = texture(uMap, uv);

  gl_FragColor = vec4(color);
 
}
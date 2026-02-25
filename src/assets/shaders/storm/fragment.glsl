#pragma glslify: falloff = require(../utils/functions.glsl)
#pragma glslify: cnoise = require(../utils/perlin.glsl)

precision mediump float;

uniform float uTime;
uniform vec2  uSizes;
uniform float uReveal;
uniform float uProgress;

varying vec2 vUv;
varying vec3 vWorldPosition;

// Colors
const vec3 COL_NAVY  = vec3(0.05, 0.08, 0.16);

void main() {
    vec2 uv = vUv;
    vec3 col = COL_NAVY;

    // Reveal
    float d = length(uv - 0.5);
    float amplitude = .2;
    float frequency = .17;
    d -= cnoise(vec4(vWorldPosition * frequency, uTime * 0.05)) * amplitude;
    float alphaReveal = 1. - falloff(d, -amplitude, 0.5 + amplitude, 0.1, uProgress);
    float alpha = 1.0;
    alpha *= alphaReveal;

    gl_FragColor = vec4(col, alphaReveal);
}
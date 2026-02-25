#pragma glslify: falloff = require(../utils/functions.glsl)
#pragma glslify: cnoise = require(../utils/perlin.glsl)

uniform float uTime;
uniform float uProgress;
uniform sampler2D uTexture;

varying vec2 vUv;
varying vec3 vWorldPosition;


void main() {
    vec2 uv = vUv;
    vec4 col = texture2D(uTexture, uv);

    // Reveal
    float d = length(uv - 0.5);
    float amplitude = .2;
    float frequency = .17;
    d -= cnoise(vec4(vWorldPosition * frequency, uTime * 0.05)) * amplitude;
    float alphaReveal = 1. - falloff(d, -amplitude, 0.5 + amplitude, 0.1, uProgress);
    float alpha = col.a;
    alpha *= alphaReveal;

    gl_FragColor = vec4(col.rgb, alphaReveal);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
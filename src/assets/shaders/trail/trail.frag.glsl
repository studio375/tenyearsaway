precision mediump float;

uniform sampler2D uPrevTrail;
uniform vec2 uMouse;
uniform vec2 uMouseDir;
uniform float uVelocity;
uniform float uDecay;
uniform float uBrushSize;
uniform float uAspect;
uniform float uReveal;

varying vec2 vUv;

void main() {
  // Decay previous frame's trail
  float prev = texture2D(uPrevTrail, vUv).r * uDecay;

  // Aspect-correct the offset so the blob is circular, not elliptical
  vec2 delta = vUv - uMouse;
  delta.x *= uAspect;

  // Elongate blob along movement direction for brushstroke feel
  // uMouseDir is normalized in aspect-corrected space
  vec2 dir = length(uMouseDir) > 0.001 ? uMouseDir : vec2(0.0, 1.0);
  float along = dot(delta, dir);
  float perp = length(delta - along * dir);
  float elongation = 1.0 + uVelocity * 2.0;
  float blobDist = sqrt(along * along / elongation + perp * perp);

  float blob = exp(-blobDist * blobDist / (uBrushSize * uBrushSize)) * uReveal;

  gl_FragColor = vec4(min(prev + blob, 1.0), 0.0, 0.0, 1.0);
}
precision mediump float;


uniform sampler2D uTrailTexture;
uniform vec2 uResolution;
uniform float uCellSize;
uniform vec3 uColor;

varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  // Convert UV to screen pixels
  vec2 pixel = vUv * uResolution;

  // Halftone grid: find which cell this pixel belongs to
  vec2 cellCoord = floor(pixel / uCellSize);
  vec2 cellCenter = (cellCoord + 0.5) * uCellSize;
  vec2 cellCenterUv = cellCenter / uResolution;

  // Sample trail density at the cell center (not per-pixel — creates the dot pattern)
  float density = texture2D(uTrailTexture, cellCenterUv).r;

  // Distance from cell center, normalized (0 = center, 0.5 = cell edge midpoint)
  float dist = length(fract(pixel / uCellSize) - 0.5);

  // Dot radius grows with density, modulated by noise
  float radius = density * 0.47 ;

  // Hard dot edge
  float inDot = step(dist, radius);

  // smoothstep threshold avoids single-pixel noise dots at near-zero density
  float alpha = inDot * smoothstep(0.05, 0.2, density);

  gl_FragColor = vec4(uColor, alpha);
}
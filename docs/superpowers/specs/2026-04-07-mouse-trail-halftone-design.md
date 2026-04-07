# Mouse Trail Halftone — Design Spec

**Date:** 2026-04-07
**Status:** Approved

## Overview

A fullscreen mouse trail effect that reveals a halftone dot pattern as the user moves the cursor. The dots are black, evoke a classic comic book aesthetic, and dissolve from the tail (oldest points fade first). Lives entirely inside the existing R3F Canvas.

## Architecture

Two R3F sub-components inside a single `MouseTrail` parent:

1. **`TrailPainter`** — invisible fullscreen mesh. Each frame, paints a Gaussian blob at the current mouse position onto a ping-pong render target. Applies decay (`uDecay ~0.97`) to fade older trail areas. Uses only the red channel of the render target.

2. **`HalftonePlane`** — visible fullscreen mesh. Reads the trail texture produced by `TrailPainter`. Fragment shader converts the density map into a halftone dot grid: dots whose radius scales with local density. Black dots, alpha-composited over the scene.

Strict separation: `TrailPainter` knows nothing about halftone; `HalftonePlane` knows nothing about the mouse. They communicate only via texture.

## Files

```
src/components/Scene/MouseTrail/index.jsx
src/assets/shaders/mouseTrail/trail.frag.glsl
src/assets/shaders/mouseTrail/halftone.frag.glsl
src/assets/shaders/mouseTrail/shared.vert.glsl
```

## Shader Design

### `trail.frag.glsl` (TrailPainter)

- Samples `uPrevTrail` (previous frame's render target) and multiplies by `uDecay`
- Adds a Gaussian blob centered on `uMouse` with radius `uBrushSize` (~0.04 UV units)
- Blob intensity scales with `uVelocity` — faster mouse = slightly elongated blob (brushstroke feel)
- Output: float 0–1 stored in `gl_FragColor.r`

### `halftone.frag.glsl` (HalftonePlane)

- Divides screen into a regular grid of cells (~`uCellSize` UV units, ~8–10px at 1080p)
- For each fragment: finds its cell center, samples the trail texture at the cell center
- Computes dot radius: `r = density * cellSize * 0.7`
- Fragment is "inside dot" if `distance(fragUV, cellCenter) < r`
- Output: `vec4(0, 0, 0, step(dist, r) * density)` — black with alpha driven by density

### `shared.vert.glsl`

Standard passthrough vertex shader: outputs `vUv` and `gl_Position`. Shared by both meshes.

## Uniforms

| Uniform | Type | Used by | Description |
|---|---|---|---|
| `uResolution` | vec2 | both | Viewport size in pixels |
| `uMouse` | vec2 | TrailPainter | Mouse position in UV (0–1) |
| `uVelocity` | float | TrailPainter | Mouse speed (px/frame), normalized |
| `uDecay` | float | TrailPainter | Trail fade factor per frame (~0.97) |
| `uBrushSize` | float | TrailPainter | Gaussian blob radius in UV space (~0.04) |
| `uPrevTrail` | sampler2D | TrailPainter | Previous frame's render target |
| `uTrailTexture` | sampler2D | HalftonePlane | Current frame's trail texture |
| `uCellSize` | float | HalftonePlane | Halftone grid cell size in UV space (~0.012) |

## React / R3F Integration

### `MouseTrail/index.jsx`

- `useRef` for two `WebGLRenderTarget` instances (`rtA`, `rtB`) at fixed `512×512`
- `useEffect` registers `pointermove` listener (works on touch too), updates `mouseRef` and `velocityRef`; cleaned up on unmount
- `useFrame` per-frame sequence:
  1. Swap ping-pong targets (`read ↔ write`)
  2. `gl.setRenderTarget(writeTarget)` → render `TrailPainter` mesh
  3. `gl.setRenderTarget(null)` → restore
  4. `HalftonePlane` reads `readTarget.texture` automatically
- No allocations inside `useFrame`

### `Scene/index.jsx`

Add `<MouseTrail />` as the last child inside `<Canvas>`. `HalftonePlane` uses `renderOrder={1}` to render above `Background` (`renderOrder={-1}`).

## Performance Constraints

- Render target resolution: `512×512` (fixed, DPR-independent)
- Mouse tracking via `pointermove` only (no polling)
- Single `useFrame` callback (no nested loops)
- Trail texture uses `LinearFilter`, no mipmaps
- `depthWrite: false`, `depthTest: false` on both materials

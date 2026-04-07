# Mouse Trail Halftone — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fullscreen halftone dot trail effect that follows the mouse cursor inside the existing R3F Canvas, using ping-pong FBO for GPU-accelerated decay.

**Architecture:** A `MouseTrail` component creates two `WebGLRenderTarget`s (ping-pong). Each frame, a trail shader paints a Gaussian blob at the mouse position onto a render target while applying per-frame decay to the previous frame's output. A separate halftone shader reads the resulting density map and converts it to a grid of black dots whose radius scales with density.

**Tech Stack:** React Three Fiber, Three.js (`WebGLRenderTarget`, `ShaderMaterial`, `OrthographicCamera`), GLSL (loaded via raw-loader + glslify-loader), Next.js Pages Router.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/assets/shaders/mouseTrail/shared.vert.glsl` | Passthrough UV vertex shader, used by both offscreen and screen meshes |
| Create | `src/assets/shaders/mouseTrail/trail.frag.glsl` | Trail paint + decay: reads previous RT, applies decay, paints Gaussian blob at mouse |
| Create | `src/assets/shaders/mouseTrail/halftone.frag.glsl` | Converts trail density texture into halftone dot grid |
| Create | `src/components/Scene/MouseTrail/index.jsx` | R3F component: ping-pong FBO setup, mouse tracking, useFrame orchestration |
| Modify | `src/components/Scene/index.jsx` | Add `<MouseTrail />` inside Canvas |

---

## Task 1: Shared Vertex Shader

**Files:**
- Create: `src/assets/shaders/mouseTrail/shared.vert.glsl`

- [ ] **Step 1: Create the shared vertex shader**

  ```glsl
  precision mediump float;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  ```

  This is identical to the existing `background/vertex.glsl` (minus `vWorldPosition`) — a simple passthrough that works for both the offscreen `OrthographicCamera` pass and the main scene fullscreen mesh.

- [ ] **Step 2: Commit**

  ```bash
  git add src/assets/shaders/mouseTrail/shared.vert.glsl
  git commit -m "feat: add shared vertex shader for mouse trail"
  ```

---

## Task 2: Trail Fragment Shader

**Files:**
- Create: `src/assets/shaders/mouseTrail/trail.frag.glsl`

- [ ] **Step 1: Create the trail paint + decay shader**

  ```glsl
  precision mediump float;

  uniform sampler2D uPrevTrail;
  uniform vec2 uMouse;
  uniform vec2 uMouseDir;
  uniform float uVelocity;
  uniform float uDecay;
  uniform float uBrushSize;
  uniform float uAspect;

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

    float blob = exp(-blobDist * blobDist / (uBrushSize * uBrushSize));

    gl_FragColor = vec4(min(prev + blob, 1.0), 0.0, 0.0, 1.0);
  }
  ```

  **How it works:**
  - `prev * uDecay`: multiplies previous trail by ~0.97 each frame → dissolves from tail (oldest parts decayed most)
  - `delta.x *= uAspect`: corrects for non-square UV space so blob is circular on screen
  - `elongation`: stretches blob in movement direction proportional to velocity, giving a calligraphy-brush feel
  - Stores result in `.r` channel only; `.g`, `.b` unused

- [ ] **Step 2: Commit**

  ```bash
  git add src/assets/shaders/mouseTrail/trail.frag.glsl
  git commit -m "feat: add trail paint + decay fragment shader"
  ```

---

## Task 3: Halftone Fragment Shader

**Files:**
- Create: `src/assets/shaders/mouseTrail/halftone.frag.glsl`

- [ ] **Step 1: Create the halftone render shader**

  ```glsl
  precision mediump float;

  uniform sampler2D uTrailTexture;
  uniform vec2 uResolution;
  uniform float uCellSize;

  varying vec2 vUv;

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

    // Dot radius grows with density, max 0.47 to leave a hairline gap between dots
    float radius = density * 0.47;

    // Hard dot edge
    float inDot = step(dist, radius);

    // smoothstep threshold avoids single-pixel noise dots at near-zero density
    float alpha = inDot * smoothstep(0.05, 0.2, density);

    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
  }
  ```

  **How it works:**
  - Divides the screen into a regular pixel grid (`uCellSize` × `uCellSize` px cells)
  - Each cell has a single density value sampled from the trail texture at the cell center — this is what creates the halftone pattern (all pixels in a cell use the same density)
  - `step(dist, radius)` creates a hard circular dot, consistent with comic-book halftone printing
  - `smoothstep(0.05, 0.2, density)` suppresses near-invisible dots so the effect only appears where there's meaningful trail

- [ ] **Step 2: Commit**

  ```bash
  git add src/assets/shaders/mouseTrail/halftone.frag.glsl
  git commit -m "feat: add halftone dot render fragment shader"
  ```

---

## Task 4: MouseTrail React Component

**Files:**
- Create: `src/components/Scene/MouseTrail/index.jsx`

- [ ] **Step 1: Create the component**

  ```jsx
  import { useThree, useFrame } from "@react-three/fiber";
  import { useMemo, useRef, useEffect } from "react";
  import {
    WebGLRenderTarget,
    LinearFilter,
    Scene,
    OrthographicCamera,
    Mesh,
    PlaneGeometry,
    ShaderMaterial,
  } from "three";
  import vertexShader from "@/assets/shaders/mouseTrail/shared.vert.glsl";
  import trailFragmentShader from "@/assets/shaders/mouseTrail/trail.frag.glsl";
  import halftoneFragmentShader from "@/assets/shaders/mouseTrail/halftone.frag.glsl";

  const RT_SIZE = 512;

  export default function MouseTrail() {
    const { gl, size, viewport } = useThree();

    // Mouse state — plain refs, no re-renders
    const mouseRef = useRef([0.5, 0.5]);
    const prevMouseRef = useRef([0.5, 0.5]);
    const velocityRef = useRef(0);
    const dirRef = useRef([0, 0]);

    // All Three.js objects created once
    const objs = useMemo(() => {
      const rtOptions = {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
      };
      const rtA = new WebGLRenderTarget(RT_SIZE, RT_SIZE, rtOptions);
      const rtB = new WebGLRenderTarget(RT_SIZE, RT_SIZE, rtOptions);

      const trailMat = new ShaderMaterial({
        vertexShader,
        fragmentShader: trailFragmentShader,
        uniforms: {
          uPrevTrail: { value: rtA.texture },
          uMouse: { value: [0.5, 0.5] },
          uMouseDir: { value: [0.0, 0.0] },
          uVelocity: { value: 0.0 },
          uDecay: { value: 0.97 },
          uBrushSize: { value: 0.08 },
          uAspect: { value: 1.0 }, // updated on resize via useEffect
        },
        depthWrite: false,
        depthTest: false,
      });

      const halftoneMat = new ShaderMaterial({
        vertexShader,
        fragmentShader: halftoneFragmentShader,
        uniforms: {
          uTrailTexture: { value: rtB.texture },
          uResolution: { value: [1, 1] }, // updated on resize via useEffect
          uCellSize: { value: 14.0 },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
      });

      // Offscreen scene for trail painting pass
      const offScene = new Scene();
      const offCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const offGeo = new PlaneGeometry(2, 2);
      offScene.add(new Mesh(offGeo, trailMat));

      return { rtA, rtB, trailMat, halftoneMat, offScene, offCamera, offGeo };
    }, []);

    // Ping-pong refs — read from one RT, write to the other
    const readTarget = useRef(objs.rtA);
    const writeTarget = useRef(objs.rtB);

    // Sync resolution + aspect uniforms on window resize
    useEffect(() => {
      objs.halftoneMat.uniforms.uResolution.value = [size.width, size.height];
      objs.trailMat.uniforms.uAspect.value = size.width / size.height;
    }, [size.width, size.height, objs]);

    // Mouse tracking via pointermove (works on touch too)
    useEffect(() => {
      const onPointerMove = (e) => {
        prevMouseRef.current = [...mouseRef.current];
        mouseRef.current = [
          e.clientX / window.innerWidth,
          1.0 - e.clientY / window.innerHeight, // flip Y: UV origin is bottom-left
        ];

        // Aspect-corrected direction for use in trail shader
        const aspect = window.innerWidth / window.innerHeight;
        const dx = (mouseRef.current[0] - prevMouseRef.current[0]) * aspect;
        const dy = mouseRef.current[1] - prevMouseRef.current[1];
        const len = Math.sqrt(dx * dx + dy * dy);

        // Clamp velocity to [0, 1]; scale factor 40 maps typical mouse deltas to ~0-1
        velocityRef.current = Math.min(len * 40, 1.0);

        if (len > 0.0001) {
          dirRef.current = [dx / len, dy / len];
        }
      };

      window.addEventListener("pointermove", onPointerMove);
      return () => window.removeEventListener("pointermove", onPointerMove);
    }, []);

    // Dispose on unmount
    useEffect(() => {
      return () => {
        objs.rtA.dispose();
        objs.rtB.dispose();
        objs.halftoneMat.dispose();
        objs.trailMat.dispose();
        objs.offGeo.dispose();
      };
    }, [objs]);

    useFrame(() => {
      const { trailMat, halftoneMat, offScene, offCamera } = objs;

      // Update trail uniforms from current mouse state
      trailMat.uniforms.uPrevTrail.value = readTarget.current.texture;
      trailMat.uniforms.uMouse.value = mouseRef.current;
      trailMat.uniforms.uMouseDir.value = dirRef.current;
      trailMat.uniforms.uVelocity.value = velocityRef.current;

      // Render trail to write target
      const prevRT = gl.getRenderTarget();
      gl.setRenderTarget(writeTarget.current);
      gl.clear();
      gl.render(offScene, offCamera);
      gl.setRenderTarget(prevRT);

      // Point halftone shader at the freshly written texture
      halftoneMat.uniforms.uTrailTexture.value = writeTarget.current.texture;

      // Swap ping-pong
      const tmp = readTarget.current;
      readTarget.current = writeTarget.current;
      writeTarget.current = tmp;

      // Bleed velocity to zero between frames
      velocityRef.current *= 0.8;
    });

    return (
      <mesh
        scale={[viewport.width, viewport.height, 1]}
        material={objs.halftoneMat}
        renderOrder={1}
      >
        <planeGeometry args={[1, 1]} />
      </mesh>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/components/Scene/MouseTrail/index.jsx
  git commit -m "feat: add MouseTrail R3F component with ping-pong FBO halftone"
  ```

---

## Task 5: Wire Into Scene + Verify

**Files:**
- Modify: `src/components/Scene/index.jsx`

- [ ] **Step 1: Add `<MouseTrail />` to the Canvas**

  Open `src/components/Scene/index.jsx`. Add the import and the component:

  ```jsx
  import { Canvas } from "@react-three/fiber";
  import ComicBook from "./ComicBook";
  import { Suspense } from "react";
  import { Preload, AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";
  import Book from "./Book";
  import Background from "./Background";
  import { PlaneGeometry } from "three";
  import Intro from "./Background/Intro";
  import Team from "./Team";
  import MouseTrail from "./MouseTrail";

  const geometry = new PlaneGeometry(1, 1, 8, 8);

  export default function Scene() {
    return (
      <div id="scene" className="fixed inset-0 left-0 top-0 z-0">
        <Canvas
          gl={{
            alpha: true,
            antialias: true,
            stencil: false,
            powerPreference: "high-performance",
          }}
          dpr={[1, 1.5]}
        >
          <Suspense fallback={null}>
            <ComicBook />
          </Suspense>
          <Suspense fallback={null}>
            <Book />
          </Suspense>
          <Suspense fallback={null}>
            <Team />
          </Suspense>
          <Background geometry={geometry} />
          <Intro geometry={geometry} />
          <MouseTrail />
          <Preload all />
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
        </Canvas>
      </div>
    );
  }
  ```

- [ ] **Step 2: Start the dev server and verify**

  ```bash
  npm run dev
  ```

  Open `http://localhost:3000`. Move the mouse over the canvas. Expected result:
  - Black halftone dots appear where the mouse has passed
  - The trail dissolves from the oldest positions first
  - Faster mouse movement produces a slightly elongated brushstroke shape
  - Dots fade completely when the mouse stops (within ~2-3 seconds)
  - No console errors

  If dots appear but don't fade: check `uDecay` value (should be ~0.97, lower = faster fade).
  If dots are too large/small: tweak `uCellSize` in `halftoneMat` (default 14.0 px).
  If trail doesn't appear at all: check browser console for GLSL compilation errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/Scene/index.jsx
  git commit -m "feat: wire MouseTrail into Scene canvas"
  ```

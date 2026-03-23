# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (uses Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test suite is configured.

## Architecture

**Ten Years Away** is a Next.js 16 (Pages Router) creative experience — a scrollable interactive comic/graphic novel. The actual visual experience lives entirely inside a fixed R3F (`<Canvas>`; the Next.js pages themselves render almost no DOM.

### Data flow

Content is fetched from a headless WordPress backend (`admin10.375.studio/wp-json/wp/v2`) using the custom post type `anno` (year) with ACF fields. `src/helpers/api/fetch-api.js` + `api-helpers.js` handle all fetching. Pages use `getStaticProps`/`getStaticPaths` with ISR.

The `Bridge` component (`src/components/Utility/Bridge.jsx`) is the bridge between Next.js page props and the Zustand store — it reads WordPress data from props and calls `setYearData` / `setPages` on the store, respecting in-flight page transitions before syncing.

### Global state (`src/store/useStore.js`)

Zustand store holds all cross-component state:
- `loaded` — whether assets are ready (controls intro animations)
- `transition` — page transition state (`false` | `"exit"`)
- `activeYear`, `frames`, `page` — current year's comic data from WordPress
- `pages` — list of all year pages (used by the Book component)
- `objects` — Three.js mesh refs registered per frame
- `background` — ref to the Background mesh
- `active` — whether the Book experience is active
- `selectedPage` — which book page is selected/zoomed

### Layout structure

`Layout` (always mounted) wraps everything in this order:
```
ScrollProvider (Lenis smooth scroll)
  Header
  Home          ← home page intro animation, only visible on /
  {children}    ← Next.js page content (usually null or a Bridge)
  Scene         ← fixed R3F Canvas (z-index: 0)
  .noise        ← CSS noise overlay
  Footer
  Loader
  StateManager  ← listens to router events, sets transition state
```

`StateManager` (`src/components/Utility/StateManager.jsx`) fires `setTransition("exit")` on route changes to trigger exit animations before navigation completes.

### Scene / Three.js (`src/components/Scene/`)

The R3F Canvas contains:
- **`ComicBook`** — the main scroll-driven experience. Renders comic frames as `Mesh` components laid out horizontally; camera follows scroll progress via Lenis. Frame positions and camera targets are hardcoded per year in `src/assets/data.js` (`positions`, `cameraTargets`, `captionsPositions`).
- **`Book`** — a 3D interactive flipbook shown on the `/year` index page. Uses `@use-gesture/react` for drag-to-flip, `maath` easing, KTX2 textures for cover.
- **`Background`** — full-screen GLSL shader plane that reacts to scroll velocity.
- **`Intro`** — GLSL shader for the intro animation.

A shared `PlaneGeometry(1, 1, 8, 8)` is passed as a prop into Background and Intro to avoid re-creation.

### GLSL shaders

Shaders live in `src/assets/shaders/` and are imported directly as strings via `raw-loader` + `glslify-loader` (configured in `next.config.mjs` under `turbopack.rules`). Import like:
```js
import vertexShader from "@/assets/shaders/background/vertex.glsl";
```

### Routing

- `/` — home page, sets `transition: false`, shows the `Home` intro SVG animation
- `/year/[slug]` — individual year page; renders a `Bridge` that loads comic frame data into the store; the scrollable area is `h-[1600vh]` to drive Lenis scroll progress

### Styling

Tailwind CSS v4 (via `@tailwindcss/postcss`), normalize.css, and a custom `globals.css`. CSS variables define the palette: `--text-color` (#d65938 orange), `--text-blue` (#cce8eb), `--bg-blue` (#a5d8dd), `--storm` (#0d1429). Base font-size is `10px` so `1rem = 10px`.

### Fonts & GSAP

- Custom font: **PPValve** (extralight 200, medium 500, extrabold 800) — loaded via `next/font/local` in `_app.js`
- GSAP is re-exported from `src/lib/gsap.js` (with plugins like `SplitText` registered) — always import from there, not directly from `gsap`

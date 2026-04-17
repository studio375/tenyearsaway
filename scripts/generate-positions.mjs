#!/usr/bin/env node
/**
 * generate-positions.mjs
 *
 * Chiede un anno da riga di comando, recupera le vignette dal backend WP,
 * calcola positions e cameraTargets, poi aggiorna src/assets/data.js.
 *
 * Usage: node scripts/generate-positions.mjs
 */

import readline from "readline";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../src/assets/data.js");
const BASE_URL = "https://admin10.375.studio/wp-json/wp/v2";

// ─── Viewport reference (desktop 1280×720, fov=75°, camera z=5) ────────────
const CAM_Z = 5;
const FOV_RAD = (75 * Math.PI) / 180;
const VP_HEIGHT = 2 * Math.tan(FOV_RAD / 2) * CAM_Z; // ≈ 7.67
const VP_WIDTH = VP_HEIGHT * (1280 / 720); // ≈ 13.64

const MAX_WIDTH = VP_WIDTH * 0.7;
const MIN_WIDTH = VP_WIDTH * 0.4;
const MAX_HEIGHT = VP_HEIGHT * 0.65;

// ─── Replicated from src/helpers/functions.js ───────────────────────────────
function getMeshSizes(image, maxWidth, maxHeight, minWidth, maxAspectRatio) {
  const ar = image.width / image.height;
  let w = maxWidth * (ar / maxAspectRatio);
  if (w < minWidth) w = minWidth;
  if (w > maxWidth) w = maxWidth;
  let h = w / ar;
  if (h > maxHeight) {
    h = maxHeight;
    w = h * ar;
  }
  return { meshWidth: w, meshHeight: h };
}

// Proporzioni originali, cross-year consistenti (specchio di index.jsx desktop)
const GLOBAL_REF_WIDTH = 1300;
function getMeshSizesProportional(frames) {
  const maxImageWidth = Math.max(
    GLOBAL_REF_WIDTH,
    ...frames.map((f) => f.immagine.width),
  );
  const vpPerPx = MAX_WIDTH / maxImageWidth;
  return frames.map((f) => {
    const ar = f.immagine.width / f.immagine.height;
    let meshW = f.immagine.width * vpPerPx * 0.9;
    let meshH = f.immagine.height * vpPerPx * 0.9;
    if (meshH > MAX_HEIGHT) {
      meshH = MAX_HEIGHT;
      meshW = meshH * ar;
    }
    return { meshWidth: meshW, meshHeight: meshH };
  });
}

// ─── Position generator ──────────────────────────────────────────────────────
/**
 * Lays meshes out left-to-right starting at x=0, with random y-drift
 * for a cinematic comic-strip feel.
 */
function generatePositions(meshSizes) {
  const MIN_GAP = VP_WIDTH * 0.1;
  const MAX_GAP = VP_WIDTH * 0.18;

  const positions = [];
  let currentX = 0;
  let lastY = 0;

  meshSizes.forEach((mesh, i) => {
    if (i === 0) {
      positions.push([0, 0, 0.0011]);
      currentX = mesh.meshWidth / 2;
      return;
    }

    const gap = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
    currentX += mesh.meshWidth / 2 + gap;

    const dir = Math.random() > 0.5 ? 1 : -1;
    let y = lastY + dir * (VP_HEIGHT / 5) * Math.random();
    const maxY = VP_HEIGHT / 2 - mesh.meshHeight / 2;
    const minY = -VP_HEIGHT / 2 + mesh.meshHeight / 2;
    y = Math.min(Math.max(y, minY), maxY);

    const z = parseFloat(((i + 1) * 0.001).toFixed(4));
    positions.push([currentX, y, z]);

    currentX += mesh.meshWidth / 2;
    lastY = y;
  });

  return positions;
}

// ─── Camera target generator ─────────────────────────────────────────────────
/**
 * Each target sits above the mesh (same x/y) with a randomised z
 * in the range [3.2, 6.0] to create a push/pull cinematic effect.
 * The first frame always starts at z=5 (neutral distance).
 */
function generateCameraTargets(positions) {
  return positions.map((pos, i) => ({
    x: pos[0],
    y: pos[1],
    z: i === 0 ? 5 : parseFloat((3.2 + Math.random() * 2.8).toFixed(4)),
  }));
}

// ─── WP fetch ────────────────────────────────────────────────────────────────
async function fetchYear(slug) {
  const url = `${BASE_URL}/anno?slug=${slug}&acf_format=standard&per_page=100`;
  console.log(`\nFetching → ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? (data[0] ?? null) : null;
}

// ─── data.js read / write ────────────────────────────────────────────────────

/** Evaluate the current data.js and return plain objects. */
function readCurrentData() {
  const src = readFileSync(DATA_PATH, "utf-8").replace(
    /export const /g,
    "var ",
  );

  // Use Function so const/let are function-scoped and returnable
  const fn = new Function(
    `${src}; return { positions, cameraTargets, comicLayouts };`,
  );
  return fn();
}

/** Serialize a positions array: [[x,y,z], ...] */
function serializePositions(yearData) {
  const inner = Object.entries(yearData)
    .map(([year, arr]) => {
      const rows = arr.map(([x, y, z]) => `    [${x}, ${y}, ${z}]`).join(",\n");
      return `  ${year}: [\n${rows},\n  ]`;
    })
    .join(",\n");
  return `export const positions = {\n${inner},\n};\n`;
}

/** Serialize a cameraTargets object: { x, y, z }[] per year */
function serializeCameraTargets(yearData) {
  const inner = Object.entries(yearData)
    .map(([year, arr]) => {
      const rows = arr
        .map(
          ({ x, y, z }) =>
            `    {\n      x: ${x},\n      y: ${y},\n      z: ${z},\n    }`,
        )
        .join(",\n");
      return `  ${year}: [\n${rows},\n  ]`;
    })
    .join(",\n");
  return `export const cameraTargets = {\n${inner},\n};\n`;
}

/** Serialize comicLayouts — pass-through, keep as-is using JSON */
function serializeComicLayouts(data) {
  const inner = Object.entries(data)
    .map(([year, layout]) => {
      const { settings, items } = layout;
      const settingsStr = JSON.stringify(settings);
      const itemsStr = items
        .map((it) => "      " + JSON.stringify(it))
        .join(",\n");
      return `  ${year}: {\n    settings: ${settingsStr},\n    items: [\n${itemsStr},\n    ],\n  }`;
    })
    .join(",\n");
  return `export const comicLayouts = {\n${inner},\n};\n`;
}

function writeDataFile(positions, cameraTargets, comicLayouts) {
  const out = [
    serializePositions(positions),
    serializeCameraTargets(cameraTargets),
    serializeComicLayouts(comicLayouts),
  ].join("\n");
  writeFileSync(DATA_PATH, out, "utf-8");
}

// ─── Main ────────────────────────────────────────────────────────────────────
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

(async () => {
  try {
    const input = (await ask("Anno (es: 2015): ")).trim();
    rl.close();

    const year = parseInt(input, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      console.error("Anno non valido.");
      process.exit(1);
    }
    const slug = String(year);

    // 1. Fetch WP data
    const yearData = await fetchYear(slug);
    if (!yearData?.acf?.vignette?.length) {
      console.error(`Nessuna vignetta trovata per l'anno ${year}.`);
      process.exit(1);
    }
    const frames = yearData.acf.vignette;
    console.log(`✓ ${frames.length} vignette trovate`);

    // 2. Compute mesh sizes (proporzionale alle dimensioni originali, cross-year)
    const meshSizes = getMeshSizesProportional(frames);

    meshSizes.forEach((s, i) => {
      console.log(
        `  [${i}] ${frames[i].immagine.width}×${frames[i].immagine.height} → mesh ${s.meshWidth.toFixed(3)} × ${s.meshHeight.toFixed(3)}`,
      );
    });

    // 3. Generate positions
    const newPositions = generatePositions(meshSizes);

    // 4. Generate camera targets
    const newCameraTargets = generateCameraTargets(newPositions);

    console.log("\nPositions:");
    newPositions.forEach((p, i) =>
      console.log(`  [${i}] [${p.map((v) => v.toFixed(4)).join(", ")}]`),
    );
    console.log("\nCamera targets:");
    newCameraTargets.forEach((t, i) =>
      console.log(`  [${i}] x:${t.x.toFixed(4)} y:${t.y.toFixed(4)} z:${t.z}`),
    );

    // 5. Read current data and merge
    const current = readCurrentData();

    current.positions[year] = newPositions;
    current.cameraTargets[year] = newCameraTargets;
    // comicLayouts is untouched

    // 6. Write back
    writeDataFile(
      current.positions,
      current.cameraTargets,
      current.comicLayouts,
    );
    console.log(`\n✓ data.js aggiornato per l'anno ${year}`);
  } catch (err) {
    console.error("Errore:", err.message);
    process.exit(1);
  }
})();

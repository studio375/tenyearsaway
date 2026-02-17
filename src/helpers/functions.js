export function generateMeshPositions(
  meshes,
  viewportWidth,
  viewportHeight,
  minGap = 0.5,
  maxGap = 1.0
) {
  const positions = [];
  let currentX = viewportWidth; // partenza a destra
  let lastY = 0;

  meshes.forEach((mesh, index) => {
    // gap casuale
    const gap = minGap + Math.random() * (maxGap - minGap);

    // Y narrativa
    let yOffset;
    if (index === 0) {
      yOffset = 0;
    } else {
      // spostamento verticale ± metà viewportHeight/6, ma tenendo continuità narrativa
      const direction = Math.random() > 0.5 ? 1 : -1; // decide se sale o scende
      yOffset = lastY + direction * (viewportHeight / 4) * Math.random();

      // limiti per non uscire dalla viewport
      const maxY = viewportHeight / 2 - mesh.meshHeight / 2;
      const minY = -viewportHeight / 2 + mesh.meshHeight / 2;
      yOffset = Math.min(Math.max(yOffset, minY), maxY);
    }

    // salva la posizione
    positions.push([currentX + mesh.meshWidth / 2, yOffset, 0]);

    // aggiorno X e Y per la prossima mesh
    currentX += mesh.meshWidth + gap;
    lastY = yOffset;
  });

  return { positions };
}

/**
 * Genera la posizione di una caption relativa alla mesh principale
 * @param {Object} options - Opzioni per il posizionamento
 * @param {Array} options.meshPosition - Posizione della mesh [x, y, z]
 * @param {Object} options.meshSize - Dimensioni della mesh { meshWidth, meshHeight }
 * @param {Object} options.captionSize - Dimensioni della caption { width, height }
 * @param {number} options.padding - Padding tra mesh e caption (default: 0.2)
 * @param {number} options.maxHorizontalOffset - Offset orizzontale massimo (default: 0.5)
 * @param {number} [options.seed] - Seed opzionale per risultati consistenti (usa index)
 * @returns {Object} - { position: [x, y, z], placement: 'top' | 'bottom' }
 */
export function generateCaptionPosition({
  meshPosition,
  meshSize,
  captionSize,
  padding = 0.2,
  maxHorizontalOffset = 0.5,
  seed = null,
}) {
  // Funzione pseudo-random con seed per risultati consistenti
  const seededRandom = (s) => {
    if (s === null) return Math.random();
    const x = Math.sin(s * 9999) * 10000;
    return x - Math.floor(x);
  };

  const random1 = seededRandom(seed);
  const random2 = seededRandom(seed !== null ? seed + 1 : null);

  // Decide se posizionare sopra o sotto
  const isAbove = random1 > 0.5;

  // Calcola l'offset verticale per non sovrapporre
  const verticalOffset =
    meshSize.meshHeight / 2 + captionSize.height / 2 + padding;

  // Calcola la posizione Y
  const captionY = isAbove
    ? meshPosition[1] + verticalOffset
    : meshPosition[1] - verticalOffset;

  // Calcola l'offset orizzontale (da -maxHorizontalOffset a +maxHorizontalOffset)
  const horizontalOffset =
    (random2 - 0.5) * 2 * maxHorizontalOffset * meshSize.meshWidth;

  // Limita l'offset orizzontale per non uscire troppo dai bordi della mesh
  const maxAllowedOffset = (meshSize.meshWidth - captionSize.width) / 2;
  const clampedHorizontalOffset = Math.max(
    -maxAllowedOffset,
    Math.min(maxAllowedOffset, horizontalOffset)
  );

  const captionX = meshPosition[0] + clampedHorizontalOffset;

  // Z leggermente davanti alla mesh
  const captionZ = meshPosition[2] + 0.01;

  return {
    position: [captionX, captionY, captionZ],
    placement: isAbove ? "top" : "bottom",
  };
}

// const meshPositions = useMemo(() => {
//   return generateMeshPositions(meshSizes, viewport.width, viewport.height);
// }, [meshSizes, viewport.width, viewport.height]);

// const cameraTargets = useMemo(() => {
//   return positions[activeYear].map((p) => {
//     const randomZ = 3 + Math.random() * 2;
//     return new Vector3(p[0], p[1], p[2] + randomZ);
//   });
// }, [positions, activeYear]);

// useMemo(() => {
//   if (!frames || meshSizes.length === 0 || captionSizes.length === 0) return;

//   const generatedCaptionPositions = frames.map((frame, index) => {
//     if (!frame.testo) return null;

//     const result = generateCaptionPosition({
//       meshPosition: positions[activeYear][index],
//       meshSize: meshSizes[index],
//       captionSize: {
//         width: captionSizes[index].meshWidth,
//         height: captionSizes[index].meshHeight,
//       },
//       padding: 0.2,
//       maxHorizontalOffset: 0.5,
//       seed: index,
//     });

//     return {
//       x: result.position[0],
//       y: result.position[1],
//       z: result.position[2],
//       placement: result.placement,
//     };
//   });

//   console.log("Generated Caption Positions:", generatedCaptionPositions);
// }, [frames, meshSizes, captionSizes, activeYear]);

export function getMeshSizes(
  image,
  maxWidth,
  maxHeight,
  minWidth,
  maxAspectRatio
) {
  const aspectRatio = image.width / image.height;
  let meshW = maxWidth * (aspectRatio / maxAspectRatio);
  if (meshW < minWidth) {
    meshW = minWidth;
  }
  let meshH = meshW / aspectRatio;
  if (meshH > maxHeight) {
    meshH = maxHeight;
    meshW = meshH * aspectRatio;
  }
  return { meshWidth: meshW, meshHeight: meshH };
}

// Calcola posizioni e dimensioni basate su una griglia
export const generateGridPositions = (layoutConfig) => {
  const { settings, items } = layoutConfig;
  const { columns, rows, gap, pageWidth, pageHeight } = settings;

  const totalGapW = (columns - 1) * gap;
  const totalGapH = (rows - 1) * gap;
  const cellWidth = (pageWidth - totalGapW) / columns;
  const cellHeight = (pageHeight - totalGapH) / rows;

  return items.map((item) => {
    const meshWidth = item.spanW * cellWidth + (item.spanW - 1) * gap;
    let meshHeight = item.spanH * cellHeight + (item.spanH - 1) * gap;
    let margin = 0;

    if (item.maintainAspect && item.aspectRatio) {
      let newHeight = meshWidth / item.aspectRatio;
      margin = (meshHeight - newHeight) / 2 + gap * 2;
      meshHeight = newHeight;
    }

    const gridX = item.col * (cellWidth + gap);
    const gridY = item.row * (cellHeight + gap);

    const x = -pageWidth / 2 + gridX + meshWidth / 2;
    const y = pageHeight / 2 - gridY - meshHeight / 2 - margin;

    return {
      x,
      y,
      z: 0,
      width: meshWidth,
      height: meshHeight,
    };
  });
};

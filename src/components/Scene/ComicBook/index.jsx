import { useStore } from "@/store/useStore";
import { PlaneGeometry, Vector3, CatmullRomCurve3 } from "three";
import { useThree } from "@react-three/fiber";
import { useRef, useMemo, useLayoutEffect } from "react";
import Mesh from "./Mesh";
import CameraRig from "./CameraRig";
import Caption from "./Caption";
import { positions, cameraTargets, ZOOM_START_2025 } from "@/assets/data";
import { getMeshSizes, getCaptionPositions } from "@/helpers/functions";
import { useLenis } from "lenis/react";
import TransitionHandler from "./TransitionHandler";
import Page from "./Page";

const sharedGeometry = new PlaneGeometry(1, 1, 32, 32);

export default function ComicBook() {
  // Main variables
  const { frames, activeYear, page } = useStore();
  const { size } = useThree();
  const staticViewport = useMemo(() => {
    const distance = 5; // z fisso della mia camera
    const fov = (75 * Math.PI) / 180; // fov fisso della mia camera
    const height = 2 * Math.tan(fov / 2) * distance;
    const width = height * (size.width / size.height);
    return { width, height };
  }, [size]);

  const maxWidth =
    size.width >= 1024
      ? staticViewport.width * 0.7
      : staticViewport.width * 0.9;
  const minWidth =
    size.width >= 1024
      ? staticViewport.width * 0.4
      : staticViewport.width * 0.85;
  const maxHeight = staticViewport.height * 0.65;
  const maxAspectRatio = useMemo(() => {
    if (!frames || frames.length === 0) return 1;
    return Math.max(
      ...frames.map((frame) => frame.immagine.width / frame.immagine.height),
    );
  }, [frames]);

  // Ref
  const groupRef = useRef(null);

  // Sizes first — xScaleFactor depends on these
  const meshSizes = useMemo(() => {
    if (!frames) return [];
    if (size.width >= 1024) {
      // Proporzioni originali, screen-agnostic, cross-year consistenti.
      // GLOBAL_REF_WIDTH = larghezza massima vista tra tutti gli anni (2015: 1272px).
      // Clampiamo da sotto così anni con immagini piccole non sovra-scalano.
      const GLOBAL_REF_WIDTH = 1284;
      const maxImageWidth = Math.max(
        GLOBAL_REF_WIDTH,
        ...frames.map((f) => f.immagine.width),
      );
      const vpPerPx = maxWidth / maxImageWidth;
      return frames.map((frame) => {
        const ar = frame.immagine.width / frame.immagine.height;
        let meshW = frame.immagine.width * vpPerPx * 0.9;
        let meshH = frame.immagine.height * vpPerPx * 0.9;
        if (meshH > maxHeight) {
          meshH = maxHeight;
          meshW = meshH * ar;
        }
        return { meshWidth: meshW, meshHeight: meshH };
      });
    }
    return frames.map((frame) => {
      return getMeshSizes(
        frame.immagine,
        maxWidth,
        maxHeight,
        minWidth,
        maxAspectRatio,
        size.width,
      );
    });
  }, [
    frames,
    maxWidth,
    maxAspectRatio,
    minWidth,
    maxHeight,
    size.width,
    staticViewport.width,
  ]);

  const isMobile = size.width < 1024;

  const xScaleFactor = useMemo(() => {
    if (isMobile) return 1;
    const aspectFactor = Math.min(
      1,
      staticViewport.width / (staticViewport.height * (16 / 9)),
    );
    if (aspectFactor >= 1) return 1;

    const yearPositions = positions[activeYear];
    if (!yearPositions || yearPositions.length < 2 || meshSizes.length < 2)
      return aspectFactor;

    const minGap = staticViewport.width * 0.15;
    let maxNeededFactor = aspectFactor;

    for (let i = 1; i < yearPositions.length; i++) {
      const dx = Math.abs(yearPositions[i][0] - yearPositions[i - 1][0]);
      if (dx === 0) continue;
      const halfLeft = meshSizes[i - 1].meshWidth * 0.5;
      const halfRight = meshSizes[i].meshWidth * 0.5;
      const neededSpacing = halfLeft + halfRight + minGap;
      const neededFactor = neededSpacing / dx;
      maxNeededFactor = Math.max(maxNeededFactor, neededFactor);
    }

    return Math.min(1, maxNeededFactor);
  }, [isMobile, staticViewport, activeYear, meshSizes]);

  const mobileGap = staticViewport.height * 0.12;

  const mobilePositions = useMemo(() => {
    if (!meshSizes.length) return [];
    const result = [];
    const x0 =
      meshSizes[0].meshWidth > staticViewport.width
        ? meshSizes[0].meshWidth / 3
        : 0;
    let currentX = x0;
    meshSizes.forEach((s, i) => {
      if (i === 0) {
        result.push([x0, 0, 0.0011]);
      } else {
        currentX +=
          meshSizes[i - 1].meshWidth / 2 + mobileGap + s.meshWidth / 2;
        result.push([currentX, 0, (i + 1) * 0.001]);
      }
    });
    return result;
  }, [meshSizes, mobileGap, staticViewport.width]);

  const mobileCameraTargets = useMemo(() => {
    if (!mobilePositions.length) return [];
    return mobilePositions.map((p, i) => ({
      x: i === 0 ? 0 : p[0],
      y: 0,
      z: 5,
    }));
  }, [mobilePositions]);

  const activePositions = useMemo(
    () => (isMobile ? mobilePositions : positions[activeYear]),
    [isMobile, mobilePositions, activeYear],
  );

  const activeTargets = useMemo(
    () => (isMobile ? mobileCameraTargets : cameraTargets[activeYear]),
    [isMobile, mobileCameraTargets, activeYear],
  );

  const totalWidth = useMemo(() => {
    return meshSizes.reduce((acc, curr) => acc + curr.meshWidth, 0);
  }, [meshSizes]);

  const staticFactor = size.height / staticViewport.height;

  const captionSizes = useMemo(() => {
    if (!meshSizes.length) return [];
    return frames.map((frame, index) => {
      if (!Array.isArray(frame?.dialogo) || frame.dialogo.length === 0)
        return [];
      return frame.dialogo.map((dialogoItem) => {
        if (!dialogoItem?.immagine_txt) return null;
        const refDim = size.width < 1024 ? size.height : size.width;
        const isTablet = size.width >= 600 && size.width < 1024;
        const scaleFloor = isTablet ? 0.4 : 0.196;
        const minHFloor = isTablet ? 0.38 : 0.35;
        const scale = Math.max(scaleFloor, (0.38 / 1920) * refDim);
        const minH = Math.max(minHFloor, (0.5 / 1920) * refDim);
        const ar =
          dialogoItem.immagine_txt.width / dialogoItem.immagine_txt.height;
        const rawH = (dialogoItem.immagine_txt.height / staticFactor) * scale;
        const h = Math.max(rawH, minH);
        const w =
          h > rawH
            ? minH * ar
            : (dialogoItem.immagine_txt.width / staticFactor) * scale;

        const sizeMultiplier = activeYear === "2016" ? 1.25 : 1;
        const isMobile = size.width <= 500;
        const minCaptionW =
          meshSizes[index].meshWidth >= 8.5 ? 1 : staticViewport.width * 0.075;
        const mobileMinW = isMobile ? staticViewport.width * 0.2 : 0;
        const scaledW = w * sizeMultiplier;
        const scaledH = h * sizeMultiplier;
        const finalW = Math.max(scaledW, minCaptionW, mobileMinW);
        const finalH = finalW > scaledW ? finalW / ar : scaledH;
        return {
          meshWidth: finalW,
          meshHeight: finalH,
        };
      });
    });
  }, [
    frames,
    meshSizes,
    staticFactor,
    size.width,
    size.height,
    staticViewport,
    activeYear,
  ]);

  const captionPositions = useMemo(() => {
    if (!activePositions?.length) return [];
    return getCaptionPositions(
      frames,
      meshSizes,
      activePositions,
      captionSizes,
      xScaleFactor,
    );
  }, [frames, meshSizes, captionSizes, activePositions, xScaleFactor]);

  const framesTimeline = useMemo(() => {
    if (!frames?.length || !meshSizes.length || totalWidth <= 0) return [];
    const targets = activeTargets;
    if (!targets || targets.length < 2) return [];

    // Rebuild the same CatmullRom curve used by CameraRig
    const vectors = targets.map((t) =>
      t.isVector3 ? t : new Vector3(t.x * xScaleFactor, t.y, t.z),
    );
    const curve = new CatmullRomCurve3(vectors, false, "catmullrom", 0.5);
    curve.updateArcLengths();

    const N = vectors.length;
    const divisions = 1000;
    const lengths = curve.getLengths(divisions);
    const totalLength = lengths[lengths.length - 1];

    const getCenterProgress = (i) => {
      if (i <= 0) return 0;
      if (i >= N - 1) return 1;
      const t = i / (N - 1);
      const idx = t * divisions;
      const lo = Math.floor(idx);
      const hi = Math.min(lo + 1, divisions);
      const frac = idx - lo;
      const len = lengths[lo] + frac * (lengths[hi] - lengths[lo]);
      return len / totalLength;
    };

    const expansionFactor = 1.2;
    return frames.map((_, index) => {
      const frameEnd = getCenterProgress(index);
      const naturalStart = getCenterProgress(index - 1);
      const frameStart = Math.max(
        0,
        frameEnd - (frameEnd - naturalStart) * expansionFactor,
      );
      return {
        frameStart,
        frameEnd,
        duration: Math.max(frameEnd - frameStart, 0.001),
      };
    });
  }, [frames, meshSizes, totalWidth, activeTargets, xScaleFactor]);

  const framesTimelineRef = useRef([]);
  const framesProgress = useRef(
    frames?.length ? frames.map(() => ({ progress: 0 })) : [],
  );
  useLayoutEffect(() => {
    if (framesTimeline.length > 0 && totalWidth > 0) {
      framesProgress.current = frames?.length
        ? frames.map(() => ({ progress: 0 }))
        : [];
      framesTimelineRef.current = framesTimeline;
    } else if (frames?.length && framesTimeline.length === 0) {
      framesTimelineRef.current = [];
    }
  }, [framesTimeline, totalWidth, frames?.length]);

  useLenis(({ progress }) => {
    const timeline = framesTimelineRef.current;
    if (!timeline.length) return;
    const normalizedProgress =
      useStore.getState().activeYear === "2025"
        ? Math.min(progress / ZOOM_START_2025, 1)
        : progress;
    framesProgress.current = timeline.map((_, index) => ({
      progress: Math.max(
        0,
        Math.min(
          1,
          (normalizedProgress - timeline[index].frameStart) /
            timeline[index].duration,
        ),
      ),
    }));
  });

  return (
    <>
      <TransitionHandler />
      {frames && frames.length > 0 && (
        <>
          <CameraRig targets={activeTargets} xScaleFactor={xScaleFactor} />
          <group ref={groupRef}>
            {frames.map((frame, index) => {
              return (
                <group key={`${activeYear}-${frame.texture.id}`}>
                  <Mesh
                    geometry={sharedGeometry}
                    src={frame.texture.url}
                    index={index}
                    sizes={meshSizes[index]}
                    positions={activePositions[index]}
                    xScaleFactor={xScaleFactor}
                    framesProgress={framesProgress}
                  />
                  {Array.isArray(frame.dialogo) &&
                    frame.dialogo.map((dialogoItem, dialogoIdx) => (
                      <Caption
                        key={`${activeYear}-${frame.texture.id}-caption-${dialogoIdx}`}
                        geometry={sharedGeometry}
                        src={dialogoItem.immagine_txt?.url}
                        position={captionPositions[index][dialogoIdx]}
                        size={captionSizes[index][dialogoIdx]}
                        index={index}
                        framesProgress={framesProgress}
                      />
                    ))}
                </group>
              );
            })}
          </group>
          <Page geometry={sharedGeometry} page={page} />
        </>
      )}
    </>
  );
}

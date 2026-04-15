import { useStore } from "@/store/useStore";
import { PlaneGeometry, Vector3, CatmullRomCurve3 } from "three";
import { useThree } from "@react-three/fiber";
import { useRef, useMemo, useLayoutEffect } from "react";
import Mesh from "./Mesh";
import CameraRig from "./CameraRig";
import Caption from "./Caption";
import { positions, cameraTargets } from "@/assets/data";
import { getMeshSizes, getCaptionPositions } from "@/helpers/functions";
import { useLenis } from "lenis/react";
import TransitionHandler from "./TransitionHandler";
import Page from "./Page";

const sharedGeometry = new PlaneGeometry(1, 1, 32, 32);

export default function ComicBook() {
  // Main variables
  const { frames, activeYear, page } = useStore();
  const { size, viewport } = useThree();
  const staticViewport = useMemo(() => {
    const distance = 5; // z fisso della mia camera
    const fov = (75 * Math.PI) / 180; // fov fisso della mia camera
    const height = 2 * Math.tan(fov / 2) * distance;
    const width = height * (size.width / size.height);
    return { width, height };
  }, [size]);

  const xScaleFactor = Math.max(0.7, Math.min(1, size.width / 1440));

  const maxWidth =
    size.width >= 1024
      ? staticViewport.width * 0.7
      : staticViewport.width * 0.9;
  const minWidth =
    size.width >= 1024
      ? staticViewport.width * 0.4
      : staticViewport.width * 0.85;
  const maxHeight = staticViewport.height * 0.8;
  const maxAspectRatio = useMemo(() => {
    if (!frames || frames.length === 0) return 1;
    return Math.max(
      ...frames.map((frame) => frame.immagine.width / frame.immagine.height),
    );
  }, [frames]);

  // Ref
  const groupRef = useRef(null);

  // Sizes
  const meshSizes = useMemo(() => {
    if (!frames) return [];
    return frames.map((frame, index) => {
      const sizes = getMeshSizes(
        frame.immagine,
        maxWidth,
        maxHeight,
        minWidth,
        maxAspectRatio,
        size.width,
      );
      return sizes;
    });
  }, [frames, maxWidth, maxAspectRatio, minWidth, maxHeight, size.width]);

  const totalWidth = useMemo(() => {
    return meshSizes.reduce((acc, curr) => acc + curr.meshWidth, 0);
  }, [meshSizes]);

  const captionSizes = useMemo(() => {
    if (!meshSizes.length) return [];
    return frames.map((frame, index) => {
      if (!Array.isArray(frame?.dialogo) || frame.dialogo.length === 0)
        return [];
      return frame.dialogo.map((dialogoItem) => {
        if (!dialogoItem?.immagine_txt) return null;
        const minH = 0.5;
        const ar =
          dialogoItem.immagine_txt.width / dialogoItem.immagine_txt.height;
        const rawH = (dialogoItem.immagine_txt.height / viewport.factor) * 0.4;
        const h = Math.max(rawH, minH);
        const w =
          h > rawH
            ? minH * ar
            : (dialogoItem.immagine_txt.width / viewport.factor) * 0.4;

        console.log(w, h);
        return { meshWidth: w, meshHeight: h };
      });
    });
  }, [frames, meshSizes, viewport.factor]);

  const captionPositions = useMemo(() => {
    return getCaptionPositions(
      frames,
      meshSizes,
      positions[activeYear],
      captionSizes,
      xScaleFactor,
    );
  }, [frames, meshSizes, captionSizes, activeYear, xScaleFactor]);

  const framesTimeline = useMemo(() => {
    if (!frames?.length || !meshSizes.length || totalWidth <= 0) return [];
    const targets = cameraTargets[activeYear];
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
  }, [frames, meshSizes, totalWidth, activeYear, xScaleFactor]);

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
    framesProgress.current = timeline.map((_, index) => ({
      progress: Math.max(
        0,
        Math.min(
          1,
          (progress - timeline[index].frameStart) / timeline[index].duration,
        ),
      ),
    }));
  });

  return (
    <>
      <TransitionHandler />
      {frames && frames.length > 0 && (
        <>
          <CameraRig
            targets={cameraTargets[activeYear]}
            xScaleFactor={xScaleFactor}
          />
          <group ref={groupRef}>
            {frames.map((frame, index) => {
              return (
                <group key={`${activeYear}-${frame.texture.id}`}>
                  <Mesh
                    geometry={sharedGeometry}
                    src={frame.texture.url}
                    index={index}
                    sizes={meshSizes[index]}
                    positions={positions[activeYear][index]}
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

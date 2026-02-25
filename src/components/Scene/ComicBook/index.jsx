import { useStore } from "@/store/useStore";
import { PlaneGeometry } from "three";
import { useThree } from "@react-three/fiber";
import { useRef, useMemo, useLayoutEffect } from "react";
import Mesh from "./Mesh";
import CameraRig from "./CameraRig";
import Caption from "./Caption";
import { positions, cameraTargets } from "@/assets/data";
import { captionsPositions } from "@/assets/data";
import { getMeshSizes } from "@/helpers/functions";
import { useLenis } from "lenis/react";
import TransitionHandler from "./TransitionHandler";
import Page from "./Page";
import { useProgress } from "@react-three/drei";
const sharedGeometry = new PlaneGeometry(1, 1, 64, 64);

export default function ComicBook() {
  // Main variables
  const progress = useProgress();
  const { frames, activeYear, page } = useStore();
  const { size } = useThree();
  const staticViewport = useMemo(() => {
    const distance = 5; // z fisso della mia camera
    const fov = (75 * Math.PI) / 180; // fov fisso della mia camera
    const height = 2 * Math.tan(fov / 2) * distance;
    const width = height * (size.width / size.height);
    return { width, height };
  }, [size]);

  const maxWidth = staticViewport.width * 0.7;
  const minWidth = staticViewport.width * 0.4;
  const maxHeight = staticViewport.height * 0.8;
  const maxAspectRatio = useMemo(() => {
    if (!frames || frames.length === 0) return 1;
    return Math.max(
      ...frames.map((frame) => frame.immagine.width / frame.immagine.height),
    );
  }, [frames]);

  const captionLimit = useMemo(() => {
    const c = Math.max(
      ...frames.map((frame) =>
        frame.testo ? frame.testo.width / frame.testo.height : 1,
      ),
    );
    return {
      maxWidth: maxWidth * 0.3,
      maxHeight: maxHeight * 0.3,
      minWidth: minWidth * 0.3,
      maxAspectRatio: c,
    };
  }, [frames, maxWidth, minWidth, maxHeight]);

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
      );
      return sizes;
    });
  }, [frames, maxWidth, maxAspectRatio, minWidth, maxHeight]);

  const totalWidth = useMemo(() => {
    return meshSizes.reduce((acc, curr) => acc + curr.meshWidth, 0);
  }, [meshSizes]);

  const captionSizes = useMemo(() => {
    return frames.map((frame, index) => {
      return getMeshSizes(
        frame.testo,
        captionLimit.maxWidth,
        captionLimit.maxHeight,
        captionLimit.minWidth,
        captionLimit.maxAspectRatio,
      );
    });
  }, [frames, captionLimit]);

  const framesTimeline = useMemo(() => {
    if (!frames?.length || !meshSizes.length || totalWidth <= 0) return [];
    let currentWidth = 0;
    return frames.map((frame, index) => {
      const frameStart =
        (currentWidth - meshSizes[index].meshWidth * 0.75) / totalWidth;
      const frameEnd = (currentWidth + meshSizes[index].meshWidth) / totalWidth;
      currentWidth += meshSizes[index].meshWidth;
      return { frameStart, frameEnd, duration: frameEnd - frameStart };
    });
  }, [frames, meshSizes, totalWidth]);

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
          <CameraRig targets={cameraTargets[activeYear]} />
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
                    framesProgress={framesProgress}
                  />
                  {frame.testo && captionsPositions[activeYear][index] && (
                    <Caption
                      geometry={sharedGeometry}
                      src={frame.testo.url}
                      position={captionsPositions[activeYear][index]}
                      size={captionSizes[index]}
                      index={index}
                      framesProgress={framesProgress}
                    />
                  )}
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

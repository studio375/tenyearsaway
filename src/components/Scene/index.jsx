import { Canvas, useFrame } from "@react-three/fiber";
import ComicBook from "./ComicBook";
import { Suspense, useRef } from "react";
import { Preload, AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";
import Book from "./Book";
import Background from "./Background";
import { PlaneGeometry } from "three";
import Intro from "./Background/Intro";
import Team from "./Team";
import Trail from "./Trail";
import { useStore } from "@/store/useStore";

const geometry = new PlaneGeometry(1, 1, 8, 8);

function SceneReadyReporter() {
  const frameCount = useRef(0);
  useFrame(() => {
    frameCount.current++;
    if (frameCount.current === 3) {
      useStore.getState().setSceneReady();
    }
  });
  return null;
}

export default function Scene() {
  return (
    <div id="scene" className="fixed inset-0 left-0 top-0 z-0">
      <Canvas
        gl={{
          alpha: true,
          antialias: true,
          stencil: false,
          powerPreference: "high-performance",
          shadowMap: false,
        }}
        dpr={[1, 1.5]}
        shadows={false}
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
        <Trail />
        <SceneReadyReporter />
        <Preload all />
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
      </Canvas>
    </div>
  );
}

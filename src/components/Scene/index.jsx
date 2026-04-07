import { Canvas } from "@react-three/fiber";
import ComicBook from "./ComicBook";
import { Suspense } from "react";
import { Preload, AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";
import Book from "./Book";
import Background from "./Background";
import { PlaneGeometry } from "three";
import Intro from "./Background/Intro";
import Team from "./Team";

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
        <Preload all />
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
      </Canvas>
    </div>
  );
}

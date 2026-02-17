import { Canvas } from "@react-three/fiber";
import ComicBook from "./ComicBook";
import { Suspense } from "react";
import { Preload } from "@react-three/drei";
import Book from "./Book";
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
        shadows={false}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <ComicBook />
        </Suspense>
        <Book />
        <Preload all />
      </Canvas>
    </div>
  );
}

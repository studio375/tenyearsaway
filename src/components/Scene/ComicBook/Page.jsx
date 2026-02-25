import React, { useRef, useMemo, useEffect } from "react";
import { ShaderMaterial } from "three";
import { useKTX2 } from "@react-three/drei";
import { useStore } from "@/store/useStore";
import vertexShader from "@/assets/shaders/page/vertex.glsl";
import fragmentShader from "@/assets/shaders/page/fragment.glsl";
import { useFrame } from "@react-three/fiber";
const Page = function ({ geometry, page }) {
  const meshRef = useRef(null);
  const texture = useKTX2(page[1].url);
  const { addObject, removeObject, activeYear } = useStore();
  const material = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uMap: { value: texture },
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uVelocity: { value: 0 },
        uAmplitude: { value: 1.4 },
        uFrequency: { value: 0.75 },
        uLightProgress: { value: 0 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
  }, [texture]);

  const size = useMemo(() => {
    return {
      meshWidth: 5,
      meshHeight: 5 / (page[0].width / page[0].height),
    };
  }, [page]);

  useEffect(() => {
    if (!meshRef.current) return;
    const ref = meshRef.current;
    const obj = { ref, type: "page" };
    addObject(obj);
    return () => {
      removeObject(activeYear, ref.uuid);
    };
  }, [page]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const ref = meshRef.current;
    const time = clock.getElapsedTime();
    ref.material.uniforms.uTime.value = time;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[0, 0, 0]}
      scale={[size.meshWidth, size.meshHeight, 1]}
      visible={false}
    />
  );
};

export default Page;

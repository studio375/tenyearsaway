import React, { useRef, useMemo, useEffect } from "react";
import { ShaderMaterial } from "three";
import { useKTX2 } from "@react-three/drei";
import { useStore } from "@/store/useStore";
import vertexShader from "@/assets/shaders/page/vertex.glsl";
import fragmentShader from "@/assets/shaders/page/fragment.glsl";
import { useFrame, useThree } from "@react-three/fiber";
const Page = function ({ geometry, page }) {
  const meshRef = useRef(null);
  const texture = useKTX2(page[1].url);
  const { addObject, removeObject } = useStore();
  const { size } = useThree();
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

  const sizes = useMemo(() => {
    return {
      meshWidth: size.width < 1024 ? 5 * 0.75 : 5,
      meshHeight:
        size.width < 1024
          ? (5 * 0.75) / (page[0].width / page[0].height)
          : 5 / (page[0].width / page[0].height),
    };
  }, [page, size.width]);

  useEffect(() => {
    if (!meshRef.current) return;
    const ref = meshRef.current;
    const obj = { ref, type: "page" };
    addObject(obj);
    return () => {
      removeObject(ref.uuid);
      ref.material?.dispose();
    };
  }, [page]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const ref = meshRef.current;
    const time = clock.getElapsedTime();
    ref.material.uniforms.uTime.value = time;
  });

  return (
    <>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        position={[0, 0, 0]}
        scale={[sizes.meshWidth, sizes.meshHeight, 1]}
        visible={false}
      />
    </>
  );
};

export default Page;

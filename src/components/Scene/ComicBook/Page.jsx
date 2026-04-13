import React, { useRef, useMemo, useEffect } from "react";
import { ShaderMaterial } from "three";
import { useKTX2 } from "@react-three/drei";
import { useStore } from "@/store/useStore";
import vertexShader from "@/assets/shaders/page/vertex.glsl";
import fragmentShader from "@/assets/shaders/page/fragment.glsl";
import { useFrame, useThree } from "@react-three/fiber";
import BookShadow from "../Book/Shadow";

const Page = function ({ geometry, page }) {
  const meshRef = useRef(null);
  const shadowRef = useRef(null);
  const texture = useKTX2(page[1].url);
  const { addObject, removeObject } = useStore();
  const { size, gl } = useThree();

  useEffect(() => {
    if (!texture) return;
    texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;
  }, [texture]);
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
    if (!meshRef.current || !shadowRef.current) return;
    const ref = meshRef.current;
    const shadowref = shadowRef.current;
    const obj = { ref, type: "page" };
    addObject(obj);
    const shadowObj = { ref: shadowref, type: "shadow" };
    addObject(shadowObj);
    return () => {
      removeObject(ref.uuid);
      removeObject(shadowref.uuid);
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
      <BookShadow
        ref={shadowRef}
        width={size >= 1024 ? sizes.meshWidth - 1.1 : sizes.meshWidth - 0.75}
        height={size >= 1024 ? sizes.meshHeight - 1.1 : sizes.meshHeight - 0.75}
        x={-0.085}
        y={-0.07}
        z={-0.25}
        opacity={0}
        feather={0.05}
        renderOrder={-1}
        visible={false}
      />
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

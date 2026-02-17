import React, { useRef, useMemo, useEffect } from "react";
import { useLenis } from "lenis/react";
import { useKTX2 } from "@react-three/drei";
import { ShaderMaterial } from "three";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useFrame } from "@react-three/fiber";
import vertexShader from "@/assets/shaders/frame/vertex.glsl";
import fragmentShader from "@/assets/shaders/frame/fragment.glsl";
import { useStore } from "@/store/useStore";
const Mesh = function ({
  geometry,
  src,
  index,
  sizes,
  positions,
  framesProgress,
}) {
  const meshRef = useRef(null);
  const tl = useRef(null);
  const texture = useKTX2(src);
  const { addObject, removeObject, activeYear } = useStore();

  useEffect(() => {
    if (!meshRef.current) return;

    const ref = meshRef.current;
    const obj = { ref, index, type: "frame" };
    addObject(obj);
    return () => {
      removeObject(activeYear, ref.uuid);
      gsap.killTweensOf(ref.position);
      gsap.killTweensOf(ref.scale);
      if (ref.material?.uniforms) {
        gsap.killTweensOf(ref.material.uniforms.uProgress);
      }
    };
  }, []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uMap: { value: texture },
          uTime: { value: 0 },
          uProgress: { value: 0.0 },
          uAmplitude: { value: 1.4 },
          uFrequency: { value: 0.75 },
          uVelocity: { value: 0 },
        },
        transparent: true,
        alphaTest: 0,
        depthWrite: false,
        depthTest: false,
      }),
    [texture],
  );

  useEffect(() => {
    if (!meshRef.current || index === 0) return;
    const proxy = { value: 0 };
    tl.current = gsap.timeline({ paused: true }).to(proxy, {
      value: 1,
      ease: "none",
      onUpdate: () => {
        meshRef.current.material.uniforms.uProgress.value = proxy.value;
      },
    });
    return () => {
      if (tl.current) tl.current.kill();
    };
  }, [meshRef, index]);

  useGSAP(
    () => {
      if (!meshRef.current || index !== 0) return;
      tl.current = gsap.timeline();
      tl.current.to(meshRef.current.position, {
        x: positions[0],
        y: positions[1],
        z: 0,
        duration: 3,
        ease: "power2.out",
      });
      tl.current.to(
        meshRef.current.material.uniforms.uProgress,
        {
          value: 1,
          duration: 3,
          ease: "power2.out",
        },
        "<",
      );
    },
    { scope: meshRef, dependencies: [index, positions] },
  );

  useLenis(({ progress, velocity }) => {
    if (!meshRef.current) return;
    meshRef.current.material.uniforms.uVelocity.value = velocity * 0.1;
    if (index == 0 || !framesProgress.current[index] || !tl.current) return;
    if (framesProgress.current[index].progress >= 1) {
      tl.current.kill();
      tl.current = false;
      return;
    }
    tl.current.progress(framesProgress.current[index].progress);
  });

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.material.uniforms.uTime.value =
      clock.getElapsedTime() * 0.7;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={
        index !== 0
          ? [positions[0], positions[1], 0]
          : [positions[0], positions[1], -5]
      }
      scale={[sizes.meshWidth, sizes.meshHeight, 1]}
    />
  );
};

export default Mesh;

import React, { useRef, useMemo, useState, useEffect } from "react";
import { ShaderMaterial, SRGBColorSpace, Object3D } from "three";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLenis } from "lenis/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import vertexShader from "@/assets/shaders/caption/vertex.glsl";
import fragmentShader from "@/assets/shaders/caption/fragment.glsl";
import { easing } from "maath";
import { useStore } from "@/store/useStore";
const Caption = function ({
  geometry,
  src,
  position,
  size,
  index,
  framesProgress,
}) {
  const meshRef = useRef(null);
  const tl = useRef(null);
  const { addObject, removeObject } = useStore();
  useEffect(() => {
    if (!meshRef.current) return;
    const ref = meshRef.current;
    const obj = { ref, index, type: "caption" };
    addObject(obj);
    return () => {
      removeObject(ref.uuid);
    };
  }, []);

  const [randomOffset] = useState(() => Math.random() * 0.3 + 0.1);

  const texture = useTexture(src, (tex) => {
    tex.colorSpace = SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  });
  const displacement = useTexture("/textures/perlin.png");
  const material = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        uMap: { value: texture },
        uDisplacement: { value: displacement },
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uVelocity: { value: 0 },
        uSeed: { value: randomOffset },
      },
    });
  }, [texture, displacement, randomOffset]);

  useGSAP(
    () => {
      if (!meshRef.current) return;

      tl.current = gsap.timeline({
        delay: index === 0 ? 3 : 1,
        repeatDelay: 0,
        paused: true,
      });
      tl.current.to(meshRef.current.material.uniforms.uProgress, {
        value: 0.75,
        duration: 5,
        ease: "power2.out",
      });

      if (index === 0) tl.current.play();
    },
    { scope: meshRef, dependencies: [index] }
  );

  useLenis(({ progress, velocity }) => {
    if (!meshRef.current) return;
    meshRef.current.material.uniforms.uVelocity.value = velocity * 0.1;

    if (
      index == 0 ||
      !framesProgress.current[index] ||
      !tl.current ||
      tl.current.isActive() ||
      tl.current.progress() >= 1
    )
      return;

    if (framesProgress.current[index].progress > 0) {
      tl.current.play();
    }
  });

  const dummy = useMemo(() => new Object3D(), []);
  useFrame(({ clock, pointer, delta }) => {
    if (!meshRef.current) return;
    meshRef.current.material.uniforms.uTime.value =
      clock.getElapsedTime() * 0.7;

    dummy.lookAt(pointer.x * 0.1, pointer.y * 0.1, 1);
    easing.dampQ(meshRef.current.quaternion, dummy.quaternion, 0.15, delta);
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[position.x, position.y, position.z]}
      scale={[size.meshWidth, size.meshHeight, 1]}
    />
  );
};

export default Caption;

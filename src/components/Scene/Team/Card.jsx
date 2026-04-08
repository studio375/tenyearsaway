import { DoubleSide, ShaderMaterial } from "three";
import React, {
  forwardRef,
  useMemo,
  useRef,
  useImperativeHandle,
  useEffect,
} from "react";
import vertexShader from "@/assets/shaders/card/vertex.glsl";
import fragmentShader from "@/assets/shaders/card/fragment.glsl";
import { useTexture, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { gsap } from "@/lib/gsap";
import { useRouter } from "next/router";
import { useStore } from "@/store/useStore";
const Card = forwardRef(function Card(
  { card, geometry, index = 0, active = false },
  ref,
) {
  const texture = useTexture(card?.card?.url);
  const meshRef = useRef(null);
  const nameRef = useRef(null);
  const descRef = useRef(null);
  const { addObject, removeObject } = useStore();
  const { asPath } = useRouter();
  useImperativeHandle(ref, () => meshRef.current);

  useEffect(() => {
    if (!meshRef.current) return;

    const ref = meshRef.current;
    const obj = { ref, index, type: "card" };
    addObject(obj);
    return () => {
      removeObject(ref.uuid);
      ref.material?.dispose();
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
          uOffset: { value: index },
          uScrollForce: { value: 0 },
          uTrailTexture: { value: null },
        },
        transparent: true,
        alphaTest: 0,
        depthWrite: false,
        depthTest: false,
        side: DoubleSide,
      }),
    [texture, index],
  );

  useEffect(() => {
    return () => {
      material.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!nameRef.current) return;
    let tl;
    if (active) {
      tl = gsap.timeline({
        onStart: () => {
          nameRef.current.visible = true;
          descRef.current.visible = true;
        },
      });
      tl.to([nameRef.current, descRef.current], {
        fillOpacity: 1,
        duration: 1,
        stagger: 0.1,
        ease: "power3.inOut",
      });
    } else {
      gsap.to([nameRef.current, descRef.current], {
        fillOpacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.inOut",
      });
    }
    return () => {
      tl?.kill();
    };
  }, [active]);

  useEffect(() => {
    if (!meshRef.current) return;
    const ref = meshRef.current;
    ref.material.uniforms.uScrollForce.value = 0;
    ref.material.uniforms.uTime.value = 0;
  }, [asPath]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const ref = meshRef.current;
    ref.material.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        scale={[2.5, 3.5, 1]}
        renderOrder={1}
      />
      <Text
        ref={nameRef}
        visible={false}
        position={[-1.25, -2.2, 0]}
        fontSize={0.14}
        color="#000"
        anchorX="left"
        fillOpacity={0}
        anchorY="bottom"
        font="/assets/fonts/PPValve-PlainExtrabold.woff"
        letterSpacing={0}
        renderOrder={0}
        maxWidth={2.5}
      >
        {card?.name.toUpperCase()}
      </Text>
      <Text
        ref={descRef}
        visible={false}
        position={[1.2, -2.2, 0]}
        fontSize={0.14}
        color="#000"
        fillOpacity={0}
        anchorX="right"
        anchorY="bottom"
        font="/assets/fonts/PPValve-PlainMedium.woff"
        letterSpacing={0}
        renderOrder={0}
        maxWidth={2.5}
      >
        {card?.desc.toUpperCase()}
      </Text>
    </group>
  );
});

export default React.memo(Card);

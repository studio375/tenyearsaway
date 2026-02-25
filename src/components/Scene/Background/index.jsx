import { useThree, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useEffect } from "react";
import { useLenis } from "lenis/react";
import vertexShader from "@/assets/shaders/background/vertex.glsl";
import fragmentShader from "@/assets/shaders/background/fragment.glsl";
import { ShaderMaterial, MathUtils } from "three";
import { useStore } from "@/store/useStore";
import gsap from "gsap";
export default function Background({ geometry }) {
  const { size, viewport } = useThree();
  const ref = useRef(null);
  const lenis = useLenis();
  const transition = useStore((state) => state.transition);
  const setBackground = useStore((state) => state.setBackground);
  const loaded = useStore((state) => state.loaded);
  const staticViewport = useMemo(() => {
    const distance = 5;
    const fov = (75 * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * distance;
    const width = height * (size.width / size.height);
    const factor = size.height / height;
    return { width, height, factor };
  }, [size]);
  const sizes = useMemo(() => {
    return {
      width: staticViewport.width * 1.5,
      height: staticViewport.height * 1.5,
    };
  }, [staticViewport]);

  const material = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uMovement: { value: 0 },
        uSpeed: { value: 0 },
        uSizes: { value: [sizes.width, sizes.height] },
        uAlpha: { value: 0 },
      },
    });
  }, [sizes.width, sizes.height]);

  const mounted = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.scale.set(sizes.width, sizes.height, 1);
    ref.current.material.uniforms.uSizes.value = [sizes.width, sizes.height];
    if (!mounted.current) {
      mounted.current = true;
      ref.current.material.uniforms.uMovement.value = 0;
      ref.current.material.uniforms.uSpeed.value = 0;
      ref.current.material.uniforms.uTime.value = 0;
      setBackground(ref.current);
    }
  }, [sizes.width, sizes.height]);

  useEffect(() => {
    if (!ref.current || transition || !loaded) return;
    ref.current.material.uniforms.uMovement.value = 0;
    ref.current.material.uniforms.uSpeed.value = 0;
    gsap.to(ref.current.material.uniforms.uAlpha, {
      value: 1,
      duration: 1.5,
      delay: 0.2,
      ease: "power3.inOut",
    });
  }, [transition, loaded]);

  const targetSpeed = useRef(0);
  useLenis(
    ({ progress, velocity, animatedScroll, lastVelocity, isStopped }) => {
      if (
        !ref.current ||
        velocity < -400 ||
        velocity > 400 ||
        useStore.getState().transition ||
        lastVelocity < -400 ||
        isStopped ||
        (lastVelocity == 0 && progress == 1) ||
        !useStore.getState().loaded
      )
        return;

      const movement = (animatedScroll / staticViewport.factor) * 0.4;
      if (movement !== ref.current.material.uniforms.uMovement.value) {
        ref.current.material.uniforms.uMovement.value = movement;
      }
      targetSpeed.current = Math.abs(velocity * 0.005);
    },
  );

  useFrame((state) => {
    if (!ref.current || !loaded) return;

    let time = state.clock.getElapsedTime();
    ref.current.material.uniforms.uTime.value = time;

    ref.current.position.x = state.camera.position.x;
    ref.current.position.y = state.camera.position.y;

    if (!lenis.isScrolling) return;
    ref.current.material.uniforms.uSpeed.value = MathUtils.lerp(
      ref.current.material.uniforms.uSpeed.value,
      targetSpeed.current,
      0.034,
    );
  });

  return (
    <mesh
      ref={ref}
      scale={[sizes.width, sizes.height, 1]}
      geometry={geometry}
      material={material}
      renderOrder={-1}
    />
  );
}

import { useThree, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useEffect } from "react";
import vertexShader from "@/assets/shaders/storm/vertex.glsl";
import fragmentShader from "@/assets/shaders/storm/fragment.glsl";
import pageVertexShader from "@/assets/shaders/frame/vertex.glsl";
import pageFragmentShader from "@/assets/shaders/storm/pageFragment.glsl";
import { ShaderMaterial, DoubleSide, SRGBColorSpace } from "three";
import gsap from "gsap";
import { useRouter } from "next/router";
import { useTexture, Text } from "@react-three/drei";
import { useStore } from "@/store/useStore";
import BookShadow from "@/components/Scene/Book/Shadow";
export default function Intro({ geometry }) {
  const { size, gl } = useThree();
  const ref = useRef(null);
  const ref2 = useRef(null);
  const pageRef = useRef(null);
  const textRef = useRef(null);
  const { asPath } = useRouter();
  const { loaded, setActive, transition } = useStore();
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

  const pageScale = useMemo(() => {
    const ASPECT = 4 / 5.714; // width / height
    const refH = staticViewport.height * 0.74466;
    const refW = staticViewport.width * 0.264;
    let h = Math.min(refH, refW / ASPECT);
    if (size.width < 1024 && h < staticViewport.height * 0.4) {
      h = staticViewport.height * 0.55;
    }
    const w = h * ASPECT;
    return [w, h, 1];
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
        uProgress: { value: 0 },
      },
    });
  }, []);

  const texture = useTexture("/textures/cop_notitle.png");

  const materialPage = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: pageVertexShader,
      fragmentShader: pageFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: DoubleSide,
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uProgress: { value: 0 },
      },
    });
  }, [texture]);

  useEffect(() => {
    return () => {
      material.dispose();
      materialPage.dispose();
    };
  }, []);

  const tlInOut = useRef(null);
  useEffect(() => {
    if (!ref.current || !loaded || transition) return;

    tlInOut.current = gsap.timeline({
      onStart: () => {
        pageRef.current.visible = true;
      },
    });
    if (asPath !== "/") {
      tlInOut.current.to(ref.current.material.uniforms.uProgress, {
        value: 1,
        duration: 1.9,
        delay: 0.15,
        ease: "none",
      });
      tlInOut.current.add(() => {
        setActive(true);
      }, "<30%");
      tlInOut.current
        .to(
          pageRef.current.rotation,
          {
            y: -Math.PI,
            duration: 1,
            delay: 0,
            ease: "expo.in",
          },
          0,
        )
        .to(
          pageRef.current.position,
          {
            z: 4,
            duration: 1,
            delay: 0,
            ease: "expo.in",
          },
          0,
        )
        .to(
          textRef.current.position,
          {
            y: staticViewport.height,
            duration: 0.6,
            delay: 0,
            ease: "power2.in",
          },
          0,
        );
    } else {
      tlInOut.current.to(ref.current.material.uniforms.uProgress, {
        value: 0,
        duration: 1.9,
        delay: 0,
        ease: "none",
        onComplete: () => {
          setActive(false);
        },
      });
      tlInOut.current
        .to(
          pageRef.current.rotation,
          {
            y: 0,
            duration: 1.8,
            delay: 0.2,
            ease: "power2.out",
          },
          0,
        )
        .to(
          pageRef.current.position,
          {
            z: 0,
            duration: 1.8,
            delay: 0.2,
            ease: "power2.out",
          },
          0,
        )
        .fromTo(
          textRef.current.position,
          { y: staticViewport.height },
          {
            y: staticViewport.height / 2 - (size.width < 1024 ? 0.07 : 0),
            duration: 1.4,
            delay: 0.3,
            ease: "power3.out",
          },
          0,
        );
    }

    return () => {
      tlInOut.current.kill();
      tlInOut.current = null;
    };
  }, [asPath, loaded, transition]);

  useFrame((state) => {
    if (!ref.current || !loaded) return;

    let time = state.clock.getElapsedTime();
    ref.current.material.uniforms.uTime.value = time;
    ref2.current.material.uniforms.uTime.value = time;
  });

  const isMobile = useMemo(() => size.width < 1024, [size.width]);
  return (
    <group renderOrder={-2}>
      <Text
        ref={textRef}
        color="#cce8eb"
        font={"/assets/fonts/PPValve-PlainExtrabold.woff"}
        anchorX="center"
        anchorY="top-cap"
        textAlign="center"
        position={[0, staticViewport.height, 0.1]}
        fontSize={staticViewport.width * (isMobile ? 0.165 : 0.105)}
        lineHeight={0.78}
        letterSpacing={-0.06}
        material-toneMapped={false}
        receiveShadow
      >
        {isMobile ? "TEN YEARS\nAWAY" : "TEN YEARS AWAY"}
      </Text>
      <mesh
        ref={ref}
        scale={[sizes.width, sizes.height, 1]}
        geometry={geometry}
        material={material}
        renderOrder={-2}
      />
      <group
        ref={pageRef}
        position={[-2, 0, 4]}
        rotation={[0, -Math.PI, 0.03]}
        visible={false}
      >
        <BookShadow
          width={pageScale[0] - 0.3}
          height={pageScale[1] - 0.3}
          x={1.6}
          y={-0.15}
          z={-0.25}
          opacity={0.8}
          feather={0.05}
          renderOrder={-1}
        />
        <mesh
          ref={ref2}
          position={[2, 0, 0]}
          scale={pageScale} // 4 x 5.714
          geometry={geometry}
          material={materialPage}
          renderOrder={-1}
          receiveShadow={false}
          castShadow={false}
        />
      </group>
    </group>
  );
}

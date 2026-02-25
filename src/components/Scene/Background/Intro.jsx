import { useThree, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useEffect } from "react";
import vertexShader from "@/assets/shaders/storm/vertex.glsl";
import fragmentShader from "@/assets/shaders/storm/fragment.glsl";
import pageVertexShader from "@/assets/shaders/frame/vertex.glsl";
import pageFragmentShader from "@/assets/shaders/storm/pageFragment.glsl";
import { ShaderMaterial, DoubleSide } from "three";
import gsap from "gsap";
import { useRouter } from "next/router";
import { useKTX2 } from "@react-three/drei";
import { useStore } from "@/store/useStore";
export default function Intro({ geometry }) {
  const { size } = useThree();
  const ref = useRef(null);
  const ref2 = useRef(null);
  const pageRef = useRef(null);
  const { asPath } = useRouter();
  const { loaded, setActive } = useStore();
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
        uProgress: { value: 0 },
      },
    });
  }, [sizes.width, sizes.height]);

  const texture = useKTX2("/textures/cop_noTitle.ktx2");
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

  const tlInOut = useRef(null);
  useEffect(() => {
    if (!ref.current || !loaded) return;

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
        );
    }

    return () => {
      tlInOut.current.kill();
      tlInOut.current = null;
    };
  }, [asPath, loaded]);

  useFrame((state) => {
    if (!ref.current || !loaded) return;

    let time = state.clock.getElapsedTime();
    ref.current.material.uniforms.uTime.value = time;
    ref2.current.material.uniforms.uTime.value = time;
  });

  return (
    <group renderOrder={-2}>
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
        rotation={[0, -Math.PI, 0]}
        visible={false}
      >
        <mesh
          ref={ref2}
          position={[2, 0, 0]}
          scale={[4, 5.714, 1]}
          geometry={geometry}
          material={materialPage}
          renderOrder={-2}
        />
      </group>
    </group>
  );
}

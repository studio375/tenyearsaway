import { useKTX2, useTexture } from "@react-three/drei";
import gsap from "gsap";
import { useMemo, useRef, useEffect } from "react";
import { ShaderMaterial } from "three";
import vertexShader from "@/assets/shaders/book/vertex.glsl";
import fragmentShader from "@/assets/shaders/book/fragment.glsl";
import { useFrame, useThree } from "@react-three/fiber";
import { useRouter } from "next/router";
const PAGE_DEPTH = 0.003;

export default function Page({
  index,
  geometry,
  pageMaterials,
  sizes,
  frontUrl,
  backUrl,
  opened,
  currentPage,
  prevPage,
  totalSheets,
  selectedPage,
  year,
  resetBook,
  yOffset = 0,
}) {
  const groupRef = useRef(null);
  const meshRef = useRef(null);
  const [frontTexture, backTexture] = useTexture([
    frontUrl,
    backUrl || frontUrl,
  ]);
  const { gl, size } = useThree();
  const router = useRouter();

  // useEffect(() => {
  //   if (frontTexture) {
  //     frontTexture.minFilter = LinearMipmapLinearFilter; // trilinear
  //     frontTexture.magFilter = LinearFilter;
  //     frontTexture.anisotropy = gl.capabilities.getMaxAnisotropy();
  //     frontTexture.generateMipmaps = false; // le hai già embedded!
  //     frontTexture.needsUpdate = true;
  //   }
  //   if (backTexture) {
  //     backTexture.minFilter = LinearMipmapLinearFilter; // trilinear
  //     backTexture.magFilter = LinearFilter;
  //     backTexture.anisotropy = gl.capabilities.getMaxAnisotropy();
  //     backTexture.generateMipmaps = false; // le hai già embedded!
  //     backTexture.needsUpdate = true;
  //   }
  // }, [frontTexture, backTexture]);

  const materials = useMemo(() => {
    return [
      ...pageMaterials,
      new ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
          uMap: { value: frontTexture },
          uTime: { value: 0 },
          uProgress: { value: 1 },
          uOpened: { value: 0 },
          uHover: { value: 0 },
          uAmplitude: { value: 1.1 },
          uFrequency: { value: 0.8 },
          uCurl: { value: 0 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
      new ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
          uMap: { value: backTexture },
          uTime: { value: 0 },
          uProgress: { value: 1 },
          uOpened: { value: 0 },
          uHover: { value: 0 },
          uAmplitude: { value: 1.1 },
          uFrequency: { value: 0.8 },
          uCurl: { value: 0 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    ];
  }, [pageMaterials, frontTexture, backTexture]);

  useEffect(() => {
    return () => {
      materials[4]?.dispose();
      materials[5]?.dispose();
    };
  }, []);

  useEffect(() => {
    if (router.asPath === `/year`) {
      meshRef.current.position.set(
        sizes.width / 2,
        0,
        -index * PAGE_DEPTH + currentPage * PAGE_DEPTH,
      );
    }
  }, [router.asPath]);

  //GSAP
  useEffect(() => {
    if (!meshRef.current) return;

    meshRef.current.material[4].uniforms.uOpened.value = opened ? 1 : 0;
    meshRef.current.material[5].uniforms.uOpened.value = opened ? 1 : 0;
    const targetRotation = opened ? -Math.PI : 0;
    const delay = opened ? index * 0.12 : (totalSheets - index) * 0.12;
    gsap.to(groupRef.current.rotation, {
      y: targetRotation,
      duration: 1.5,
      ease: "power2.inOut",
      delay:
        ((prevPage == index - 1 || prevPage == index + 1) &&
          prevPage !== false &&
          prevPage !== 1) ||
        currentPage === 0
          ? 0
          : delay,
    });
  }, [opened]);

  // Selected Page
  const tl = useRef(null);
  useEffect(() => {
    groupRef.current.visible = true;
    meshRef.current.renderOrder = 0;
    if (!groupRef.current || selectedPage === false || selectedPage === -1) {
      if (tl.current) {
        tl.current.time(0).kill();
        resetBook();
      }
      return;
    }

    tl.current = gsap.timeline({
      onComplete: () => {
        groupRef.current.visible = false;
        tl.current.time(0).kill();
      },
      defaults: {
        duration: 0.8,
        ease: "sine.inOut",
      },
    });
    if (selectedPage === index) {
      router.prefetch(`/year/${year}`);
      tl.current.eventCallback("onComplete", () => {
        resetBook();
        tl.current.time(0).kill();
        meshRef.current.renderOrder = 0;
      });
      tl.current.eventCallback("onStart", () => {
        setTimeout(() => {
          router.push(`/year/${year}`);
        }, 500);
      });
      meshRef.current.renderOrder = 1;
      tl.current
        .to(groupRef.current.position, {
          x: opened ? sizes.width / 2 : -sizes.width / 2,
          y: -yOffset,
          z: 0.5,
        })
        .to(
          [
            meshRef.current.material[4].uniforms.uCurl,
            meshRef.current.material[5].uniforms.uCurl,
          ],
          { value: 1, ease: "expo.out" },
          "<",
        )
        .to(groupRef.current.position, { z: 5, duration: 1.4 }, "<80%")
        .to(
          [
            meshRef.current.material[4].uniforms.uProgress,
            meshRef.current.material[5].uniforms.uProgress,
          ],
          {
            value: 0,
            duration: 2.9,
            ease: "power2.out",
          },
          "<10%",
        )
        .to(
          [
            meshRef.current.material[4].uniforms.uCurl,
            meshRef.current.material[5].uniforms.uCurl,
          ],
          { value: 0, ease: "expo.in" },
          "<13%",
        );
    } else {
      tl.current.to(groupRef.current.position, {
        y: size.width <= 1024 ? -sizes.height * 2.5 : -sizes.height * 1.5,
        z: -0.5,
        x: 0,
        delay: 0.1,
        duration: 1.5,
      });
    }

    return () => {
      tl?.current?.time(0).kill();
      tl.current = null;
    };
  }, [selectedPage]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    meshRef.current.material[4].uniforms.uTime.value = time * 0.3;
    meshRef.current.material[5].uniforms.uTime.value = time * 0.3;
  });

  const meshPosition = useMemo(
    () => [sizes.width / 2, 0, -index * PAGE_DEPTH + currentPage * PAGE_DEPTH],
    [sizes.width, index, currentPage],
  );

  return (
    <group
      ref={groupRef}
      rotation={[0, currentPage === false ? -Math.PI : 0, 0]}
    >
      <mesh
        ref={meshRef}
        position={meshPosition}
        scale={[sizes.width, sizes.height, 1]}
        geometry={geometry}
        material={materials}
        frustumCulled={false}
        castShadow={true}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "grab";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "auto";
        }}
      />
    </group>
  );
}

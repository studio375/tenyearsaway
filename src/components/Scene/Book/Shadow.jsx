import { forwardRef, useMemo, useRef, useEffect } from "react";
import { ShaderMaterial, PlaneGeometry } from "three";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";

const vert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const frag = `
varying vec2 vUv;
uniform float uOpacity;
uniform float uFeather;
void main() {
  float mx = smoothstep(0.0, uFeather, vUv.x) * smoothstep(1.0, 1.0 - uFeather, vUv.x);
  float my = smoothstep(0.0, uFeather, vUv.y) * smoothstep(1.0, 1.0 - uFeather, vUv.y);
  float alpha = mx * my;
  gl_FragColor = vec4(0., 0., 0., alpha * uOpacity);
}
`;

const geo = new PlaneGeometry(1, 1, 1, 1);

const BookShadow = forwardRef(function BookShadow(
  {
    width,
    height,
    x = 0,
    y = 0,
    z = -0.3,
    opacity = 0.7,
    feather = 0.18,
    renderOrder = -0.5,
    currentPage,
    totalSheets,
    selectedPage = false,
    ...props
  },
  forwardedRef,
) {
  const meshRef = useRef(null);
  const { size } = useThree();
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uOpacity: { value: 0 },
          uFeather: { value: feather },
        },
      }),
    [],
  );

  useEffect(() => {
    return () => {
      mat.dispose();
    };
  }, []);

  useEffect(() => {
    if (!meshRef.current || currentPage === false || currentPage === undefined)
      return;
    const isOpen = currentPage > 0 && currentPage < totalSheets;
    const tl = gsap.timeline({
      delay: isOpen ? 0.8 : currentPage !== totalSheets ? 0.35 : 1.4,
    });
    tl.to(meshRef.current.scale, {
      x: isOpen ? width * 2.2 : width * 1.24,
      duration: 0.9,
      ease: "power2.out",
    }).to(
      meshRef.current.position,
      {
        x: isOpen
          ? 0
          : currentPage !== totalSheets
            ? size.width >= 1024
              ? 1.4
              : 1.13
            : -1.9,
        duration: 0.9,
        ease: "power2.out",
      },
      "<",
    );
    return () => {
      tl.kill();
    };
  }, [currentPage, totalSheets, width]);

  useEffect(() => {
    const tl = gsap.timeline();
    if (
      !meshRef.current ||
      selectedPage === false ||
      selectedPage === undefined
    ) {
      tl.to(meshRef.current.material.uniforms.uOpacity, {
        value: opacity,
        duration: 1.2,
        delay: 0.3,
        ease: "power2.out",
      });
    } else {
      tl.to(meshRef.current.material.uniforms.uOpacity, {
        value: 0,
        duration: 1.2,
        delay: 0.1,
        ease: "power2.out",
      });
    }
  }, [selectedPage]);

  return (
    <mesh
      ref={(node) => {
        meshRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      }}
      position={[x, y, z]}
      scale={[width * 1.24, height * 1.2, 1]}
      geometry={geo}
      material={mat}
      renderOrder={renderOrder}
      {...props}
    />
  );
});

export default BookShadow;

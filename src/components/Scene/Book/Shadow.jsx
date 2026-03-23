import { useMemo, useRef, useEffect } from "react";
import { ShaderMaterial, PlaneGeometry } from "three";
import gsap from "gsap";

const vert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Soft rectangular shadow — feather follows book edges independently on X and Y
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

const geo = new PlaneGeometry(1, 1);

export default function BookShadow({
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
}) {
  const meshRef = useRef(null);

  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uOpacity: { value: opacity },
          uFeather: { value: feather },
        },
      }),
    [],
  );

  // Animate shadow width: wide when book is open, narrow when closed
  useEffect(() => {
    if (!meshRef.current || currentPage === false || currentPage === undefined)
      return;
    const isOpen = currentPage > 0 && currentPage < totalSheets;
    gsap.to(meshRef.current.scale, {
      x: isOpen ? width * 2.7 : width * 1.4,
      duration: 0.9,
      ease: "power2.out",
    });
  }, [currentPage, totalSheets, width]);

  return (
    <mesh
      ref={meshRef}
      position={[x, y, z]}
      scale={[width * 1.4, height * 1.2, 1]}
      geometry={geo}
      material={mat}
      renderOrder={renderOrder}
    />
  );
}

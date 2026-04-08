import { useThree, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useEffect } from "react";
import {
  WebGLRenderTarget,
  LinearFilter,
  Scene,
  OrthographicCamera,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
} from "three";
import vertexShader from "@/assets/shaders/trail/shared.vert.glsl";
import trailFragmentShader from "@/assets/shaders/trail/trail.frag.glsl";
import halftoneFragmentShader from "@/assets/shaders/trail/halftone.frag.glsl";
import { useRouter } from "next/router";
import { gsap } from "@/lib/gsap";
import { useStore } from "@/store/useStore";

const RT_SIZE = 512;

export default function Trail() {
  const { gl, size, viewport } = useThree();
  if (size.width < 1024) return null;

  const ref = useRef();
  const mouseRef = useRef([-viewport.width, -viewport.height]);
  const prevMouseRef = useRef([-viewport.width, -viewport.height]);
  const velocityRef = useRef(0);
  const dirRef = useRef([0, 0]);
  const { asPath } = useRouter();
  const loaded = useStore((state) => state.loaded);

  const objs = useMemo(() => {
    const rtOptions = {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    };
    const rtA = new WebGLRenderTarget(RT_SIZE, RT_SIZE, rtOptions);
    const rtB = new WebGLRenderTarget(RT_SIZE, RT_SIZE, rtOptions);

    const trailMat = new ShaderMaterial({
      vertexShader,
      fragmentShader: trailFragmentShader,
      uniforms: {
        uPrevTrail: { value: rtA.texture },
        uMouse: { value: [0.5, 0.5] },
        uMouseDir: { value: [0.0, 0.0] },
        uVelocity: { value: 0.0 },
        uDecay: { value: 0.97 },
        uBrushSize: { value: 0.04 },
        uAspect: { value: 1.0 },
        uReveal: { value: 0.0 },
      },
      depthWrite: false,
      depthTest: false,
    });

    const halftoneMat = new ShaderMaterial({
      vertexShader,
      fragmentShader: halftoneFragmentShader,
      uniforms: {
        uTrailTexture: { value: rtB.texture },
        uResolution: { value: [1, 1] },
        uColor: { value: [0.2, 0.2, 0.2] },
        uCellSize: { value: 9.0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const offScene = new Scene();
    const offCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const offGeo = new PlaneGeometry(2, 2);
    offScene.add(new Mesh(offGeo, trailMat));

    return { rtA, rtB, trailMat, halftoneMat, offScene, offCamera, offGeo };
  }, []);

  // Ping-pong refs — read from one RT, write to the other
  const readTarget = useRef(objs.rtA);
  const writeTarget = useRef(objs.rtB);

  // Sync resolution + aspect uniforms on window resize
  useEffect(() => {
    objs.halftoneMat.uniforms.uResolution.value = [size.width, size.height];
    objs.trailMat.uniforms.uAspect.value = size.width / size.height;

    if (!loaded) return;
    const tl = gsap.timeline();
    tl.to(objs.trailMat.uniforms.uReveal, {
      value: 1.0,
      delay: 0.4,
      duration: 1,
      ease: "power4.inOut",
    });
    return () => {
      tl?.kill();
    };
  }, [size.width, size.height, objs, loaded]);

  useEffect(() => {
    const tl = gsap.timeline();
    if (asPath === "/") {
      tl.to(objs.halftoneMat.uniforms.uColor.value, {
        x: 0.8,
        y: 0.9,
        z: 0.9,
        delay: 0.4,
        duration: 1,
        ease: "expo",
      });
    } else {
      tl.to(objs.halftoneMat.uniforms.uColor.value, {
        x: 0.2,
        y: 0.2,
        z: 0.2,
        delay: 0.4,
        duration: 1,
        ease: "expo",
      });
    }
    return () => {
      tl.kill();
    };
  }, [asPath]);

  // Mouse tracking via pointermove (works on touch too)
  useEffect(() => {
    const onPointerMove = (e) => {
      prevMouseRef.current = [...mouseRef.current];
      mouseRef.current = [
        e.clientX / window.innerWidth,
        1.0 - e.clientY / window.innerHeight, // flip Y: UV origin is bottom-left
      ];
      if (!loaded) return;

      // Aspect-corrected direction for use in trail shader
      const aspect = window.innerWidth / window.innerHeight;
      const dx = (mouseRef.current[0] - prevMouseRef.current[0]) * aspect;
      const dy = mouseRef.current[1] - prevMouseRef.current[1];
      const len = Math.sqrt(dx * dx + dy * dy);

      // Clamp velocity to [0, 1]; scale factor 40 maps typical mouse deltas to ~0-1
      velocityRef.current = Math.min(len * 40, 1.0);

      if (len > 0.0001) {
        dirRef.current = [dx / len, dy / len];
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [loaded]);

  // Dispose on unmount
  useEffect(() => {
    return () => {
      objs.rtA.dispose();
      objs.rtB.dispose();
      objs.halftoneMat.dispose();
      objs.trailMat.dispose();
      objs.offGeo.dispose();
    };
  }, [objs]);

  useFrame((state) => {
    const { trailMat, halftoneMat, offScene, offCamera } = objs;

    // Update trail uniforms from current mouse state
    trailMat.uniforms.uPrevTrail.value = readTarget.current.texture;
    trailMat.uniforms.uMouse.value = mouseRef.current;
    trailMat.uniforms.uMouseDir.value = dirRef.current;
    trailMat.uniforms.uVelocity.value = velocityRef.current;

    // Render trail to write target
    const prevRT = gl.getRenderTarget();
    gl.setRenderTarget(writeTarget.current);
    gl.clear();
    gl.render(offScene, offCamera);
    gl.setRenderTarget(prevRT);

    // Point halftone shader at the freshly written texture
    halftoneMat.uniforms.uTrailTexture.value = writeTarget.current.texture;

    // Push trail texture to all registered frame meshes for bleach effect
    const trailTex = writeTarget.current.texture;
    useStore.getState().objects.forEach(({ ref }) => {
      if (ref?.material?.uniforms?.uTrailTexture) {
        ref.material.uniforms.uTrailTexture.value = trailTex;
      }
    });

    // Swap ping-pong
    const tmp = readTarget.current;
    readTarget.current = writeTarget.current;
    writeTarget.current = tmp;

    // Bleed velocity to zero between frames
    velocityRef.current *= 0.8;

    // Keep mesh centered on camera and correctly sized regardless of camera Z
    const cam = state.camera;
    const meshZ = ref.current.position.z; // stays at 0
    const dist = cam.position.z - meshZ;
    const fov = (cam.fov * Math.PI) / 180;
    const h = 2 * Math.tan(fov / 2) * dist;
    const w = h * (state.size.width / state.size.height);
    ref.current.position.x = cam.position.x;
    ref.current.position.y = cam.position.y;
    ref.current.scale.set(w, h, 1);
  });

  return (
    <mesh
      ref={ref}
      scale={[viewport.width, viewport.height, 1]}
      material={objs.halftoneMat}
      renderOrder={-1}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

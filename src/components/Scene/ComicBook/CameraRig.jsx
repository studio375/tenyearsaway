import { useThree } from "@react-three/fiber";
import { useMemo, useRef, useEffect } from "react";
import { Vector3, CatmullRomCurve3 } from "three";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import { useStore } from "@/store/useStore";
export default function CameraRig({ targets }) {
  const tl = useRef(null);
  const { camera } = useThree();
  const activeYear = useStore((state) => state.activeYear);
  const curve = useMemo(() => {
    if (!targets || targets.length === 0) return null;
    const vectors = targets.map((t) =>
      t.isVector3 ? t : new Vector3(t.x, t.y, t.z),
    );
    const c = new CatmullRomCurve3(vectors, false, "catmullrom", 0.5);
    c.updateArcLengths();
    return c;
  }, [targets]);

  useEffect(() => {
    if (!curve) return;
    const proxy = { value: 0 };
    tl.current = gsap.timeline({ paused: true }).to(proxy, {
      value: 1,
      ease: "none",
      onUpdate: () => {
        if (useStore.getState().transition) return;
        const point = curve.getPointAt(proxy.value);
        camera.position.copy(point);
      },
    });

    tl.current.progress(0);
    camera.position.copy(curve.getPointAt(0));

    return () => {
      tl?.current?.kill();
    };
  }, [curve, camera]);

  useLenis(({ progress }) => {
    if (!tl.current || !targets || targets.length === 0 || !activeYear) {
      return;
    }
    if (useStore.getState().transition) return;
    tl.current.progress(progress);
  });

  return null;
}

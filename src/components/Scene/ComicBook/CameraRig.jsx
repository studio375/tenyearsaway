import { useThree } from "@react-three/fiber";
import { useMemo, useRef, useEffect } from "react";
import { Vector3, CatmullRomCurve3 } from "three";
import { useLenis } from "lenis/react";
import { gsap } from "@/lib/gsap";
import { useStore } from "@/store/useStore";
import { ZOOM_START_2025 } from "@/assets/data";

export default function CameraRig({ targets, xScaleFactor = 1 }) {
  const tl = useRef(null);
  const { camera } = useThree();
  const activeYear = useStore((state) => state.activeYear);
  const setTransition = useStore((state) => state.setTransition);
  const redirectTriggeredRef = useRef(false);
  const lastTargetRef = useRef(null);

  // Reset redirect gate each time activeYear changes (handles browser back/forward to 2025)
  useEffect(() => {
    redirectTriggeredRef.current = false;
    lastTargetRef.current = targets[targets.length - 1];
  }, [activeYear, targets]);

  const curve = useMemo(() => {
    if (!targets || targets.length === 0) return null;
    const vectors = targets.map((t) =>
      t.isVector3 ? t : new Vector3(t.x * xScaleFactor, t.y, t.z),
    );
    const c = new CatmullRomCurve3(vectors, false, "catmullrom", 0.5);
    c.updateArcLengths();
    return c;
  }, [targets, xScaleFactor]);

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
    if (!tl.current || !targets || targets.length === 0) {
      return;
    }
    if (useStore.getState().transition) return;
    if (useStore.getState().activeYear === "2025") {
      if (progress > ZOOM_START_2025) {
        // zoom phase: curve stays at end, only drive z
        const zoomProgress =
          (progress - ZOOM_START_2025) / (1 - ZOOM_START_2025);
        camera.position.setZ(lastTargetRef.current.z * (1 - zoomProgress));
        if (zoomProgress >= 0.5 && !redirectTriggeredRef.current) {
          redirectTriggeredRef.current = true;
          setTransition("home");
        }
      } else {
        tl.current.progress(progress / ZOOM_START_2025);
      }
    } else {
      tl.current.progress(progress);
    }
  });

  return null;
}

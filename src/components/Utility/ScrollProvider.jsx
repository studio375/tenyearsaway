import { useLayoutEffect, useEffect } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import { useRouter } from "next/router";
import gsap from "gsap";
import { useStore } from "@/store/useStore";
function ScrollManager() {
  const lenis = useLenis();
  const { asPath } = useRouter();
  const { activeYear } = useStore();

  useEffect(() => {
    if (!lenis) return;
    gsap.ticker.lagSmoothing(0);
  }, [lenis]);

  useLayoutEffect(() => {
    if (!lenis || activeYear) return;
    lenis.resize();
    lenis.scrollTo(0, { immediate: true });
  }, [asPath, lenis]);

  return null;
}

export default function ScrollProvider({ children }) {
  return (
    <ReactLenis
      root
      options={{
        infinite: false,
        anchors: false,
        duration: 1.5,
        wheelMultiplier: 0.8,
        lerp: 0.12,
        autoResize: true,
        smoothWheel: true,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      }}
    >
      <ScrollManager />
      {children}
    </ReactLenis>
  );
}

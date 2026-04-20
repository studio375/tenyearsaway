import { useLayoutEffect, useEffect } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "@/i18n/navigation";
import gsap from "gsap";
import { useStore } from "@/store/useStore";
import { ScrollTrigger } from "@/lib/gsap";
function ScrollManager() {
  const lenis = useLenis();
  const asPath = usePathname();
  const { activeYear } = useStore();

  useEffect(() => {
    if (!lenis) return;
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }, [lenis]);

  useLayoutEffect(() => {
    if (!lenis) return;
    lenis.resize();
    if (activeYear) return;
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
        syncTouch: true,
        touchMultiplier: 1.85,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      }}
    >
      <ScrollManager />
      {children}
    </ReactLenis>
  );
}

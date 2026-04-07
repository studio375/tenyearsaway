import { useStore } from "@/store/useStore";
import { useState, useRef, useEffect } from "react";
import { useLenis } from "lenis/react";
import { gsap } from "@/lib/gsap";

export default function End() {
  const { setTransition } = useStore();
  const [end, setEnd] = useState(false);
  const endRef = useRef(null);
  const endStateRef = useRef(false);

  useLenis(({ progress }) => {
    if (progress > 0.95 && !endStateRef.current) {
      endStateRef.current = true;
      setEnd(true);
    }

    if (progress <= 0.95 && endStateRef.current) {
      endStateRef.current = false;
      setEnd(false);
    }
  });

  useEffect(() => {
    if (useStore.getState().transition) return;
    const tl = gsap.timeline();
    tl.to(endRef.current, {
      opacity: end ? 1 : 0,
      xPercent: end ? 0 : 100,
      x: 0,
      duration: 0.5,
      ease: "power3.inOut",
    });
    return () => {
      tl?.kill();
    };
  }, [end]);

  const handleClick = () => {
    gsap.to(endRef.current, {
      opacity: 0,
      xPercent: 100,
      x: 0,
      duration: 0.5,
      overwrite: true,
      ease: "power3.inOut",
    });
    setTransition("next");
  };

  return (
    <div className="fixed top-1/2 -translate-y-1/2 right-0 group">
      <div
        ref={endRef}
        className="stroke cursor-pointer bg-gradient-to-r from-bg-blue to-text-color from-50% to-50% bg-[length:200%_100%] bg-left hover:bg-right transition-all duration-300 bg-clip-text text-transparent uppercase text-[9vw] leading-[6vw] font-extrabold pointer-events-auto px-2 [writing-mode:vertical-rl] rotate-180 translate-x-full opacity-0"
        onClick={handleClick}
      >
        next
      </div>
    </div>
  );
}

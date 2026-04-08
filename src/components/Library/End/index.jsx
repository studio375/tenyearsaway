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
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      gsap.to(endRef.current, {
        opacity: end ? 1 : 0,
        xPercent: end ? 0 : 100,
        yPercent: 0,
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "power3.inOut",
      });
    });
    mm.add("(max-width: 1023px)", () => {
      gsap.to(endRef.current, {
        opacity: end ? 1 : 0,
        yPercent: end ? 0 : 30,
        xPercent: 0,
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "power3.inOut",
      });
    });
    return () => {
      mm.revert();
    };
  }, [end]);

  const handleClick = () => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      gsap.to(endRef.current, {
        opacity: 0,
        xPercent: 100,
        yPercent: 0,
        x: 0,
        y: 0,
        duration: 0.5,
        overwrite: true,
        ease: "power3.inOut",
      });
    });
    mm.add("(max-width: 1023px)", () => {
      gsap.to(endRef.current, {
        opacity: 0,
        yPercent: 30,
        xPercent: 0,
        x: 0,
        y: 0,
        duration: 0.5,
        overwrite: true,
        ease: "power3.inOut",
      });
    });
    setTransition("next");
  };

  return (
    <div className="fixed lg:top-1/2 bottom-[8rem] lg:bottom-auto -translate-y-1/2 lg:right-0 left-1/2 lg:left-auto -translate-x-1/2 lg:translate-x-0 group">
      <div
        ref={endRef}
        className="stroke cursor-pointer bg-gradient-to-r from-bg-blue to-text-color from-50% to-50% bg-[length:200%_100%] bg-left hover:bg-right transition-all duration-300 bg-clip-text text-transparent uppercase text-[9vw] leading-[6vw] font-extrabold pointer-events-auto px-2 lg:[writing-mode:vertical-rl] lg:rotate-180 rotate-0 lg:translate-x-full opacity-0"
        onClick={handleClick}
      >
        next
      </div>
    </div>
  );
}

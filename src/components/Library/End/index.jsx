import { useStore } from "@/store/useStore";
import { useState, useRef, useEffect } from "react";
import { useLenis } from "lenis/react";
import { gsap } from "@/lib/gsap";

export default function End() {
  const { setTransition, activeYear, endText } = useStore();
  const [end, setEnd] = useState(false);
  const [hovered, setHovered] = useState(false);
  const endRef = useRef(null);
  const tbcRef = useRef(null);
  const wrapperRef = useRef(null);
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

  const handleMouseEnter = () => {
    setHovered(true);
    wrapperRef.current?.classList.add("is-hovered");
  };

  const handleMouseLeave = () => {
    setHovered(false);
    wrapperRef.current?.classList.remove("is-hovered");
  };

  useEffect(() => {
    if (!tbcRef.current) return;
    gsap.killTweensOf(tbcRef.current);
    const tl = gsap.timeline();
    tl.to(tbcRef.current, {
      opacity: endText ? 1 : 0,
      duration: 0.6,
      ease: "power2.out",
    }).to(tbcRef.current, {
      opacity: 0,
      duration: 0.6,
      ease: "power2.inOut",
    });
  }, [endText]);

  if (activeYear === "2025") {
    return (
      <div
        ref={tbcRef}
        style={{ opacity: 0 }}
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      >
        <p className="text-[--text-color] text-[7rem] uppercase font-[800]">
          to be continued...
        </p>
      </div>
    );
  }

  const handleClick = () => {
    setHovered(false);
    wrapperRef.current?.classList.remove("is-hovered");
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
    <div
      ref={wrapperRef}
      className="fixed lg:top-1/2 bottom-[8rem] lg:bottom-auto -translate-y-1/2 lg:right-0 left-1/2 lg:left-auto -translate-x-1/2 lg:translate-x-0 group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={endRef}
        className={`stroke cursor-pointer bg-gradient-to-r from-bg-blue to-text-color from-50% to-50% bg-[length:200%_100%] ${hovered ? "bg-right" : "bg-left"} transition-all duration-300 bg-clip-text text-transparent uppercase text-[9vw] leading-[6vw] font-extrabold pointer-events-auto px-2 lg:[writing-mode:vertical-rl] lg:rotate-180 rotate-0 lg:translate-x-full opacity-0`}
        onClick={handleClick}
      >
        next
      </div>
    </div>
  );
}

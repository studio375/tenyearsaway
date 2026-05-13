import { useStore } from "@/store/useStore";
import { useState, useRef, useEffect } from "react";
import { useLenis } from "lenis/react";
import { gsap } from "@/lib/gsap";
import { useTranslations } from "next-intl";
import { useSound } from "@/hooks/useSound";

export default function End({ next }) {
  const { setTransition, activeYear, endText } = useStore();
  const t = useTranslations("end");
  const [end, setEnd] = useState(false);
  const [hovered, setHovered] = useState(false);
  const endRef = useRef(null);
  const tbcRef = useRef(null);
  const wrapperRef = useRef(null);
  const endStateRef = useRef(false);
  const transitionPollRef = useRef(null);
  const { play: playHoverSound } = useSound("/sound/hover.mp3", {
    volume: 1.2,
  });
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

  const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

  const handleMouseEnter = () => {
    playHoverSound();
    setHovered(true);
    wrapperRef.current?.classList.add("is-hovered");
    if (isDesktop()) {
      gsap.to(endRef.current, { x: 25, duration: 0.4, ease: "power2.out" });
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
    wrapperRef.current?.classList.remove("is-hovered");
    if (isDesktop()) {
      gsap.to(endRef.current, { x: 0, duration: 0.4, ease: "power2.out" });
    }
  };

  useEffect(() => {
    if (!tbcRef.current) return;
    gsap.killTweensOf(tbcRef.current);
    const tl = gsap.timeline();
    tl.to(tbcRef.current, {
      opacity: endText ? 1 : 0,
      duration: 0.8,
      ease: "power2.out",
    }).to(tbcRef.current, {
      opacity: 0,
      duration: 0.6,
      delay: 0.5,
      ease: "power2.inOut",
    });
  }, [endText]);

  useEffect(() => {
    return () => {
      if (transitionPollRef.current) {
        clearInterval(transitionPollRef.current);
      }
    };
  }, []);

  if (activeYear === "2025") {
    return (
      <div
        ref={tbcRef}
        style={{ opacity: 0 }}
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      >
        <p className="text-[--text-color] text-[2rem] lg:text-[4rem] xl:text-[7rem] font-[500] italic">
          {t("tbc")}
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
    const fireTransition = () => setTransition("next");

    const { frames, objects } = useStore.getState();
    const needed = frames?.length ?? 0;
    const ready = () =>
      useStore.getState().objects.filter((o) => o.type === "frame").length >= needed;

    if (needed === 0 || ready()) {
      fireTransition();
      return;
    }

    // Poll until all frames registered or 8s timeout
    let elapsed = 0;
    transitionPollRef.current = setInterval(() => {
      elapsed += 300;
      if (ready() || elapsed >= 8000) {
        clearInterval(transitionPollRef.current);
        transitionPollRef.current = null;
        fireTransition();
      }
    }, 300);
  };

  return (
    <div
      ref={wrapperRef}
      className="fixed lg:top-1/2 bottom-[0rem] lg:bottom-auto -translate-y-1/2 lg:right-0 lg:pr-[2rem] left-1/2 lg:left-auto -translate-x-1/2 lg:translate-x-0 group w-full lg:w-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={endRef}
        className="will-change-transform lg:translate-x-full opacity-0 pointer-events-auto cursor-pointer flex flex-col lg:flex-row items-center gap-0 lg:gap-6 group"
        onClick={handleClick}
        data-link
      >
        {next && (
          <div
            className={`flex flex-col items-center text-center lg:items-end lg:text-right transition-colors duration-300 order-last lg:order-first ${hovered ? "text-[--text-color]" : ""}`}
          >
            <p className="text-[1.4rem] font-medium uppercase mt-[0.6rem] mb-[0.2rem] mx-0">
              {next.acf?.titolo || next.title?.rendered}
            </p>
            <p className="text-[1.4rem] font-bold uppercase m-0">{next.slug}</p>
          </div>
        )}
        <span className="stroke small will-change-transform transition-all duration-300 bg-clip-text uppercase text-[3rem] lg:text-[4.6rem] leading-[90%] font-extrabold px-2 lg:[writing-mode:vertical-rl] lg:rotate-180 rotate-0 block">
          {t("next")}
        </span>
      </div>
    </div>
  );
}

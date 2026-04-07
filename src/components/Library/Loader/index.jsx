import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useStore } from "@/store/useStore";

const START_YEAR = 2015;
const END_YEAR = 2025;
const DIGIT_H = 160;
const EXTRA_LAPS = [0, 0, 0, 1];

const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) =>
  String(START_YEAR + i),
);

function buildStrip(col, extraLaps) {
  const colDigits = YEARS.map((year) => year[col]);

  if (new Set(colDigits).size === 1) return [colDigits[0]];

  const d = [];
  for (let lap = 0; lap < extraLaps; lap++) {
    for (let i = 0; i < colDigits.length - 1; i++) d.push(colDigits[i]);
  }
  for (const digit of colDigits) d.push(digit);
  return d;
}

const STRIPS = [0, 1, 2, 3].map((col) => buildStrip(col, EXTRA_LAPS[col]));

export default function Loader() {
  const loaderRef = useRef(null);
  const stripRefs = useRef([]);
  const setLoaded = useStore((s) => s.setLoaded);
  const soundRef = useRef(null);
  const timeRef = useRef(null);

  useEffect(() => {
    const loader = loaderRef.current;

    const initTl = gsap.timeline();
    initTl.to([soundRef.current, timeRef.current], {
      opacity: 1,
      y: 0,
      yPercent: 0,
      duration: 0.6,
      ease: "power2.out",
    });

    const animTl = gsap.timeline({
      defaults: { ease: "none" },
      paused: true,
      onComplete: () => {
        gsap.to(loader, {
          autoAlpha: 0,
          delay: 0.5,
          duration: 0.6,
          ease: "power2.inOut",
          onStart: () => {
            setLoaded(true);
          },
          onComplete: () => {
            gsap.set(loader, { display: "none" });
          },
        });
      },
    });

    STRIPS.forEach((strip, i) => {
      const totalY = -(strip.length - 1) * DIGIT_H;
      animTl.to(stripRefs.current[i], { y: totalY, duration: 6 }, 0);
    });

    gsap.to(animTl, { duration: 4, progress: 1, ease: "power3.inOut" });

    return () => {
      animTl.kill();
    };
  }, [setLoaded]);

  return (
    <div
      ref={loaderRef}
      className="fixed left-0 top-0 inset-0 z-0 w-screen h-svh bg-storm flex items-center justify-center"
    >
      <div className="absolute left-1/2 top-2 -translate-x-1/2 w-full text-center">
        <span
          className="lowercase text-text-blue opacity-0 -translate-y-3 will-change-transform block"
          ref={soundRef}
        >
          enable sound for a better experience
        </span>
      </div>
      <div className="flex text-text-blue lg:text-[16rem] text-[10rem] font-[800] leading-[120%]">
        {STRIPS.map((strip, col) => (
          <div
            key={col}
            className="overflow-hidden"
            style={{ height: DIGIT_H }}
          >
            <div ref={(el) => (stripRefs.current[col] = el)}>
              {strip.map((digit, row) => (
                <div
                  key={row}
                  className="flex items-center font-[800] justify-center tabular-nums"
                  style={{
                    height: DIGIT_H,
                    minWidth: "0.65em",
                  }}
                >
                  {digit}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute left-1/2 bottom-2 -translate-x-1/2 w-full text-center">
        <span
          className="lowercase text-text-blue opacity-0 translate-y-3 will-change-transform block"
          ref={timeRef}
        >
          yess... we are 1 year late
        </span>
      </div>
    </div>
  );
}

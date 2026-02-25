import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useStore } from "@/store/useStore";

const START_YEAR = 2015;
const END_YEAR = 2025;
const DIGIT_H = 60;
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

  useEffect(() => {
    const loader = loaderRef.current;

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
      className="fixed left-0 top-0 inset-0 z-0 w-screen h-screen bg-storm flex items-center justify-center tracking-[2em]"
    >
      <div className="flex text-text-blue text-[6rem] font-bold leading-none">
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
                  className="flex items-center justify-center tabular-nums text-stroke-black text-stroke-2"
                  style={{
                    height: DIGIT_H,
                    minWidth: "0.65em",
                    WebkitTextStroke: "2px black",
                    textStroke: "2px black",
                  }}
                >
                  {digit}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

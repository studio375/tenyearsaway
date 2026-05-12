import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { gsap } from "@/lib/gsap";
import { useStore } from "@/store/useStore";
import { useTexture } from "@react-three/drei";

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
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const setLoaded = useStore((s) => s.setLoaded);
  const setMuted = useStore((s) => s.setMuted);
  const [phase, setPhase] = useState("loading"); // "loading" o "ready"

  useEffect(() => {
    const { frames, pages } = useStore.getState();
    const pngUrls = [];
    if (frames?.length) {
      frames.forEach((frame) => {
        (frame.dialogo || []).forEach((d) => {
          if (d.immagine_txt?.url) pngUrls.push(d.immagine_txt.url);
        });
      });
    }
    if (pages?.length) {
      pages.forEach((p) => {
        if (p.full?.url) pngUrls.push(p.full.url);
      });
    }
    if (pngUrls.length) useTexture.preload(pngUrls);

    if (frames?.length) {
      frames.forEach((frame) => {
        if (!frame.texture?.url) return;
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = frame.texture.url;
        document.head.appendChild(link);
      });
    }
  }, []);

  useEffect(() => {
    const initTl = gsap.timeline();
    initTl.to([topRef.current, bottomRef.current], {
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
        gsap.to([topRef.current, bottomRef.current], {
          opacity: 0,
          duration: 0.25,
          ease: "power2.in",
          onComplete: () => {
            flushSync(() => setPhase("ready")); // re-render sincrono → DOM aggiornato
            gsap.to([topRef.current, bottomRef.current], {
              opacity: 1,
              duration: 0.4,
              ease: "power2.out",
              stagger: 0.08,
            });
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
  }, []);

  function enter(withSound) {
    if (!withSound) setMuted(true);
    gsap.to(loaderRef.current, {
      autoAlpha: 0,
      duration: 0.6,
      ease: "power2.inOut",
      onStart: () => setLoaded(true),
      onComplete: () => gsap.set(loaderRef.current, { display: "none" }),
    });
  }

  const isReady = phase === "ready";

  return (
    <div
      ref={loaderRef}
      className="fixed left-0 top-0 inset-0 z-1 w-screen h-svh bg-storm flex items-center justify-center"
    >
      <div className="absolute left-1/2 top-2 -translate-x-1/2 w-full text-center">
        <span
          key={
            phase === "ready"
              ? "enter with sound"
              : "enable sound for a better experience"
          }
          ref={topRef}
          onClick={isReady ? () => enter(true) : undefined}
          className={`lowercase text-text-blue opacity-0 will-change-transform block ${isReady ? "cursor-pointer hover:opacity-70 transition-opacity pointer-events-auto" : "-translate-y-3"}`}
        >
          {phase === "ready"
            ? "enter with sound"
            : "enable sound for a better experience"}
        </span>
      </div>
      <div className="flex text-text-blue lg:text-[16rem] text-[10rem] font-extrabold leading-[120%]">
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
                  className="flex items-center font-extrabold justify-center tabular-nums"
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
          key={
            phase === "ready"
              ? "enter without sound"
              : "yess... we are 1 year late"
          }
          ref={bottomRef}
          onClick={phase === "ready" ? () => enter(false) : undefined}
          className={`lowercase text-text-blue opacity-0 will-change-transform block pointer-events-auto ${isReady ? "cursor-pointer hover:opacity-70 transition-opacity" : "translate-y-3"}`}
        >
          {phase === "ready"
            ? "enter without sound"
            : "yess... we are 1 year late"}
        </span>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useStore } from "@/store/useStore";
import { useTexture } from "@react-three/drei";
import { audioTracks } from "@/assets/data";

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
  const topLoadingRef = useRef(null);
  const topReadyRef = useRef(null);
  const bottomLoadingRef = useRef(null);
  const bottomReadyRef = useRef(null);
  const loadingIndicatorRef = useRef(null);
  const setLoaded = useStore((s) => s.setLoaded);
  const setMuted = useStore((s) => s.setMuted);
  const [phase, setPhase] = useState("loading"); // "loading" o "ready"

  useEffect(() => {
    const { frames, pages } = useStore.getState();

    // Preload textures into drei cache
    const pngUrls = ["/textures/cop_notitle.png"];
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
    useTexture.preload(pngUrls);

    // Preload KTX2 textures for current year
    if (frames?.length) {
      frames.forEach((frame, i) => {
        if (!frame.texture?.url) return;
        const url = frame.texture.url;
        setTimeout(() => {
          if (document.querySelector(`link[rel="prefetch"][href="${url}"]`))
            return;
          const link = document.createElement("link");
          link.rel = "prefetch";
          link.href = url;
          document.head.appendChild(link);
        }, i * 250);
      });
    }

    // Warm up HTTP cache for audio files so Howler plays without delay
    const audioUrls = [
      audioTracks.default,
      "/sound/whoosh.mp3",
      "/sound/page-enter.mp3",
    ];
    audioUrls.forEach((url) => {
      if (document.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "audio";
      link.href = url;
      document.head.appendChild(link);
    });
  }, []);

  useEffect(() => {
    // Show top text + "loading..." indicator immediately
    const initTl = gsap.timeline();
    initTl
      .to(topLoadingRef.current, {
        opacity: 1,
        y: 0,
        yPercent: 0,
        duration: 0.6,
        ease: "power2.out",
      })
      .to(
        loadingIndicatorRef.current,
        { opacity: 1, duration: 0.4, ease: "power2.out" },
        "<",
      );

    const animTl = gsap.timeline({
      defaults: { ease: "none" },
      paused: true,
      onComplete: () => {
        gsap.to([topLoadingRef.current, bottomLoadingRef.current], {
          opacity: 0,
          duration: 0.25,
          ease: "power2.in",
          onComplete: () => {
            setPhase("ready");
            gsap.fromTo(
              [topReadyRef.current, bottomReadyRef.current],
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.4,
                ease: "power2.out",
                stagger: 0.08,
                onComplete: () => {
                  gsap.set([topReadyRef.current, bottomReadyRef.current], {
                    clearProps: "opacity",
                  });
                  [topReadyRef, bottomReadyRef].forEach((ref) => {
                    ref.current?.classList.remove(
                      "opacity-0",
                      "pointer-events-none",
                    );
                    ref.current?.classList.add("animate-pulse");
                  });
                },
              },
            );
          },
        });
      },
    });

    STRIPS.forEach((strip, i) => {
      const totalY = -(strip.length - 1) * DIGIT_H;
      animTl.to(stripRefs.current[i], { y: totalY, duration: 6 }, 0);
    });

    let sceneOk = useStore.getState().sceneReady;
    let audioOk = false;
    let animStarted = false;

    function tryStart() {
      if (!sceneOk || !audioOk || animStarted) return;
      animStarted = true;
      // Cross-fade "loading..." → "yess... we are 1 year late"
      gsap.to(loadingIndicatorRef.current, {
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          gsap.fromTo(
            bottomLoadingRef.current,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
          );
        },
      });
      gsap.to(animTl, { duration: 4, progress: 1, ease: "power3.inOut" });
    }

    const unsub = useStore.subscribe((state) => {
      if (state.sceneReady) {
        sceneOk = true;
        tryStart();
      }
    });

    // Fetch default audio track to warm HTTP cache; marks audio ready when done
    const controller = new AbortController();
    fetch(audioTracks.default, { signal: controller.signal })
      .then(() => {
        audioOk = true;
        tryStart();
      })
      .catch(() => {
        audioOk = true;
        tryStart();
      }); // don't block on network error

    return () => {
      animTl.kill();
      unsub();
      controller.abort();
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

  return (
    <div
      ref={loaderRef}
      className="fixed left-0 top-0 inset-0 z-1 w-screen h-svh bg-storm flex items-center justify-center"
    >
      <div className="absolute left-1/2 top-2 -translate-x-1/2 w-full text-center">
        <span
          ref={topLoadingRef}
          className="lowercase text-text-blue opacity-0 will-change-transform block -translate-y-3"
        >
          enable sound for a better experience
        </span>
        <span
          ref={topReadyRef}
          onClick={() => enter(true)}
          className="lowercase text-text-blue opacity-0 will-change-transform block cursor-pointer hover:opacity-70 transition-opacity absolute left-0 right-0 top-0 pointer-events-none"
        >
          enter with sound
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
          ref={loadingIndicatorRef}
          className="lowercase text-text-blue opacity-0 block absolute left-0 right-0 top-0"
        >
          loading...
        </span>
        <span
          ref={bottomLoadingRef}
          className="lowercase text-text-blue opacity-0 will-change-transform block"
        >
          yess... we are 1 year late
        </span>
        <span
          ref={bottomReadyRef}
          onClick={() => enter(false)}
          className="lowercase text-text-blue opacity-0 will-change-transform block cursor-pointer hover:opacity-70 transition-opacity absolute left-0 right-0 bottom-0 pointer-events-none"
        >
          enter without sound
        </span>
      </div>
    </div>
  );
}

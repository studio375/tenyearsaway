import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useStore } from "@/store/useStore";
import { useTexture } from "@react-three/drei";
import { audioTracks } from "@/assets/data";
import { resolveAudioPath } from "@/lib/audioPath";

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
  const pulseTweenRef = useRef(null);
  const isHoveringRef = useRef(false);
  const entryDoneRef = useRef(false);
  const setLoaded = useStore((s) => s.setLoaded);
  const setMuted = useStore((s) => s.setMuted);

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

    // Slow connection detection
    const isSlowConnection =
      navigator?.connection?.effectiveType === "3g" ||
      navigator?.connection?.effectiveType === "2g" ||
      navigator?.connection?.saveData === true;

    // Sequential audio prefetch with retry — one at a time to avoid 503s on slow connections
    async function fetchWithRetry(url, signal, maxAttempts = 3) {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          await fetch(url, { signal });
          return;
        } catch {
          if (signal?.aborted) return;
          if (attempt < maxAttempts - 1) {
            await new Promise((r) =>
              setTimeout(r, 1000 * Math.pow(2, attempt)),
            );
          } else {
            console.warn(
              `[Loader] audio prefetch failed after ${maxAttempts} attempts:`,
              url,
            );
          }
        }
      }
    }

    // Priority: critical sounds first, then year audio descending (skipped on slow connection)
    const soundUrls = [
      "/sound/mixSound.mp3",
      "/sound/whoosh.mp3",
      "/sound/page-enter.mp3",
    ].map(resolveAudioPath);

    const yearAudioUrls = isSlowConnection
      ? []
      : [
          ...(Array.isArray(audioTracks[2025])
            ? audioTracks[2025]
            : [audioTracks[2025]]),
          audioTracks[2024],
          audioTracks[2023],
          audioTracks[2022],
          audioTracks[2021],
          audioTracks[2020],
          audioTracks[2019],
          audioTracks[2018],
          audioTracks[2017],
          audioTracks[2016],
          audioTracks[2015],
          audioTracks.default,
        ].map(resolveAudioPath);

    const allPrefetchUrls = [...soundUrls, ...yearAudioUrls];
    const prefetchController = new AbortController();

    (async () => {
      for (const url of allPrefetchUrls) {
        if (prefetchController.signal.aborted) break;
        await fetchWithRetry(url, prefetchController.signal);
      }
    })();

    return () => prefetchController.abort();
  }, []);

  useEffect(() => {
    // Show top text + "loading..." indicator immediately
    const initTl = gsap.timeline();
    initTl.to(topLoadingRef.current, {
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
        gsap.to([topLoadingRef.current, bottomLoadingRef.current], {
          opacity: 0,
          duration: 0.25,
          ease: "power2.in",
          onComplete: () => {
            gsap.fromTo(
              [topReadyRef.current, bottomReadyRef.current],
              { opacity: 0, y: 18 },
              {
                opacity: 1,
                y: 0,
                pointerEvents: "auto",
                duration: 0.6,
                ease: "power3.out",
                stagger: 0.1,
                onComplete: () => {
                  entryDoneRef.current = true;
                  [topReadyRef, bottomReadyRef].forEach((ref) => {
                    ref.current?.classList.remove(
                      "opacity-0",
                      "pointer-events-none",
                    );
                  });
                  pulseTweenRef.current = gsap.to(
                    [topReadyRef.current, bottomReadyRef.current],
                    {
                      opacity: 0.4,
                      duration: 1,
                      repeat: -1,
                      yoyo: true,
                      ease: "power1.inOut",
                    },
                  );
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
    fetch(resolveAudioPath(audioTracks.default), { signal: controller.signal })
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

  function startPulse() {
    if (isHoveringRef.current) return;
    gsap.killTweensOf([topReadyRef.current, bottomReadyRef.current]);
    pulseTweenRef.current = gsap.to(
      [topReadyRef.current, bottomReadyRef.current],
      {
        opacity: 0.4,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      },
    );
  }

  function handleEnter(isTop) {
    if (!entryDoneRef.current) return;
    isHoveringRef.current = true;
    if (pulseTweenRef.current) {
      pulseTweenRef.current.kill();
      pulseTweenRef.current = null;
    }
    gsap.killTweensOf([topReadyRef.current, bottomReadyRef.current]);
    const hovered = isTop ? topReadyRef.current : bottomReadyRef.current;
    const other = isTop ? bottomReadyRef.current : topReadyRef.current;
    gsap.to(hovered, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
      overwrite: true,
    });
    gsap.to(other, {
      opacity: 0.3,
      duration: 0.3,
      ease: "power2.out",
      overwrite: true,
    });
  }

  function handleLeave() {
    if (!entryDoneRef.current) return;
    isHoveringRef.current = false;
    gsap.killTweensOf([topReadyRef.current, bottomReadyRef.current]);
    gsap.to([topReadyRef.current, bottomReadyRef.current], {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
      overwrite: true,
      onComplete: startPulse,
    });
  }

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
      className="fixed left-0 top-0 inset-0 z-13 w-screen h-svh bg-storm flex items-center justify-center pointer-events-none"
    >
      <div className="absolute left-1/2 top-2 -translate-x-1/2 w-full text-center">
        <span
          ref={topLoadingRef}
          className="lowercase text-text-blue opacity-0 will-change-transform block -translate-y-3"
        >
          enable sound for a better experience
        </span>
      </div>
      <div className="flex relative">
        {STRIPS.map((strip, col) => (
          <div
            key={col}
            className="overflow-hidden text-text-blue lg:text-[16rem] text-[10rem] font-extrabold leading-[120%]"
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
        <div
          className="absolute left-1/2 -translate-x-1/2 h-auto md:h-[3.8rem] uppercase top-[calc(100%+1rem)] w-full flex flex-col md:flex-row justify-center items-center gap-1"
          onMouseLeave={handleLeave}
        >
          <span
            ref={topReadyRef}
            onClick={() => enter(true)}
            onMouseEnter={() => handleEnter(true)}
            className="md:flex-1 w-[60%] h-[3rem] md:h-full flex items-center justify-center text-text-blue opacity-0 border border-text-blue rounded-[3px] will-change-transform cursor-pointer pointer-events-none max-md:text-[1.2rem]"
          >
            enter with sound
          </span>
          <span
            ref={bottomReadyRef}
            onClick={() => enter(false)}
            onMouseEnter={() => handleEnter(false)}
            className="md:flex-1 w-[60%] h-[3rem] md:h-full flex items-center justify-center text-text-blue opacity-0 border border-text-blue rounded-[3px] will-change-transform cursor-pointer pointer-events-none max-md:text-[1.2rem]"
          >
            enter without sound
          </span>
        </div>
      </div>
      <div className="absolute left-1/2 bottom-2 -translate-x-1/2 w-full text-center">
        <span
          ref={loadingIndicatorRef}
          className="lowercase text-text-blue block absolute left-0 right-0 top-0"
        >
          loading...
        </span>
        <span
          ref={bottomLoadingRef}
          className="lowercase text-text-blue opacity-0 will-change-transform block"
        >
          yess... we are 1 year late
        </span>
      </div>
    </div>
  );
}

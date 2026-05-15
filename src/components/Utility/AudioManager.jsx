import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Howl, Howler } from "howler";
import { useStore } from "@/store/useStore";
import { audioTracks } from "@/assets/data";
import { resolveAudioSrc } from "@/lib/audioPath";
import { useLenis } from "lenis/react";

const FADE_MS = 1500;
const SWAP_FADE_MS = 800;

export default function AudioManager() {
  const loaded = useStore((state) => state.loaded);
  const activeYear = useStore((state) => state.activeYear);
  const muted = useStore((state) => state.muted);
  const router = useRouter();

  const isYearRoute = router.pathname === "/[locale]/year/[slug]";

  const currentHowl = useRef(null);
  const currentSrc = useRef(null);
  const mutedRef = useRef(muted);
  const isYearRouteRef = useRef(isYearRoute);
  const active2025PartRef = useRef(0); // 0 = part1, 1 = part2
  const mixSoundRef = useRef(null);

  useEffect(() => {
    mutedRef.current = muted;
    Howler.mute(muted);
    if (!muted && currentHowl.current && currentHowl.current.volume() === 0) {
      currentHowl.current.fade(0, 0.35, FADE_MS);
    }
  }, [muted]);

  useEffect(() => {
    isYearRouteRef.current = isYearRoute;
  }, [isYearRoute]);

  function getDesiredSrc() {
    const y = useStore.getState().activeYear;
    if (isYearRoute && y) {
      const key = parseInt(y, 10) || y;
      const track = audioTracks[key] ?? audioTracks.default;
      // For years with multiple parts, return the first track
      return Array.isArray(track) ? track[0] : track;
    }
    return audioTracks.default;
  }

  function playTrack(src, fadeMs = FADE_MS) {
    if (currentSrc.current === src && currentHowl.current?.playing()) return;

    const prev = currentHowl.current;
    if (prev) {
      prev.fade(prev.volume(), 0, fadeMs);
      setTimeout(() => prev.unload(), fadeMs + 100);
    }

    const howl = new Howl({ src: resolveAudioSrc(src), loop: true, volume: 0 });
    howl.play();
    if (!mutedRef.current) howl.fade(0, 0.35, fadeMs);
    currentHowl.current = howl;
    currentSrc.current = src;
  }

  function playMixSound() {
    if (mutedRef.current) return;
    if (mixSoundRef.current) {
      mixSoundRef.current.stop();
      mixSoundRef.current.unload();
    }
    mixSoundRef.current = new Howl({ src: resolveAudioSrc("/sound/mixSound.mp3"), volume: 1 });
    mixSoundRef.current.play();
  }

  // Pre-warm default track during loading screen so audio is decoded before user clicks enter
  useEffect(() => {
    const src = getDesiredSrc();
    const howl = new Howl({ src: resolveAudioSrc(src), loop: true, volume: 0, preload: true });
    currentHowl.current = howl;
    currentSrc.current = src;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start after loader click (loaded = true, user gesture guaranteed)
  useEffect(() => {
    if (!loaded) return;
    // If pre-warmed howl matches, just play it — no decode delay
    const src = getDesiredSrc();
    if (
      currentSrc.current === src &&
      currentHowl.current &&
      !currentHowl.current.playing()
    ) {
      currentHowl.current.play();
      if (!mutedRef.current) currentHowl.current.fade(0, 0.35, FADE_MS);
    } else {
      playTrack(src);
    }
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch track on route / year change; reset 2025 part index
  useEffect(() => {
    active2025PartRef.current = 0;
    if (!loaded) return;
    playTrack(getDesiredSrc());
  }, [isYearRoute, activeYear]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll-driven playback rate + 2025 bidirectional mid-track swap
  useLenis(({ velocity, progress }) => {
    if (!isYearRouteRef.current || !currentHowl.current?.playing()) return;

    const rate = Math.min(
      1 + Math.max(0, Math.abs(velocity) - 27) * 0.009,
      1.9,
    );
    currentHowl.current.rate(rate);

    const y = useStore.getState().activeYear;
    if (y === "2025") {
      const desiredPart = progress >= 0.35 ? 1 : 0;
      if (desiredPart !== active2025PartRef.current) {
        active2025PartRef.current = desiredPart;
        playMixSound();
        playTrack(audioTracks[2025][desiredPart], SWAP_FADE_MS);
      }
    }
  });

  return null;
}

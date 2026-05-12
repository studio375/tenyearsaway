import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Howl, Howler } from "howler";
import { useStore } from "@/store/useStore";
import { audioTracks } from "@/assets/data";

const FADE_MS = 1500;

export default function AudioManager() {
  const loaded = useStore((state) => state.loaded);
  const activeYear = useStore((state) => state.activeYear);
  const muted = useStore((state) => state.muted);
  const router = useRouter();

  const currentHowl = useRef(null);
  const currentSrc = useRef(null);
  const mutedRef = useRef(muted);

  const isYearRoute = router.pathname === "/[locale]/year/[slug]";

  useEffect(() => {
    mutedRef.current = muted;
    Howler.mute(muted);
  }, [muted]);

  function getDesiredSrc() {
    const y = useStore.getState().activeYear;
    if (isYearRoute && y) {
      const key = parseInt(y, 10) || y;
      return audioTracks[key] ?? audioTracks.default;
    }

    return audioTracks.default;
  }

  function playTrack(src) {
    if (currentSrc.current === src && currentHowl.current?.playing()) return;

    const prev = currentHowl.current;
    if (prev) {
      prev.fade(prev.volume(), 0, FADE_MS);
      setTimeout(() => prev.unload(), FADE_MS + 100);
    }

    const howl = new Howl({ src: [src], loop: true, volume: 0 });
    howl.play();
    if (!mutedRef.current) howl.fade(0, 0.2, FADE_MS);
    currentHowl.current = howl;
    currentSrc.current = src;
  }

  // Start after loader click (loaded = true, user gesture guaranteed)
  useEffect(() => {
    if (!loaded) return;
    playTrack(getDesiredSrc());
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch track on route / year change
  useEffect(() => {
    if (!loaded) return;
    playTrack(getDesiredSrc());
  }, [isYearRoute, activeYear]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

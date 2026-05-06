import { useEffect, useRef, useCallback } from "react";
import { Howl } from "howler";

/**
 * @param {string|string[]} src
 * @param {import("howler").HowlOptions} options
 * @returns {{ play: () => void, stop: () => void, sound: React.RefObject<Howl> }}
 */
export function useSound(src, options = {}) {
  const sound = useRef(null);

  useEffect(() => {
    sound.current = new Howl({
      src: Array.isArray(src) ? src : [src],
      preload: true,
      ...options,
    });

    return () => {
      sound.current?.unload();
      sound.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const play = useCallback(() => sound.current?.play(), []);
  const stop = useCallback(() => sound.current?.stop(), []);

  return { play, stop, sound };
}

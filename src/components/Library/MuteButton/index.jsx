import { useCallback } from "react";
import { Howler } from "howler";
import { useStore } from "@/store/useStore";
import { useSound } from "@/hooks/useSound";

export default function MuteButton({ className = "" }) {
  const muted = useStore((state) => state.muted);
  const setMuted = useStore((state) => state.setMuted);
  const { play: playHoverSound } = useSound("/sound/hover.mp3", {
    volume: 1.2,
  });
  const toggleMute = useCallback(
    (e) => {
      e.stopPropagation();
      const next = !muted;
      Howler.mute(next);
      setMuted(next);
    },
    [muted, setMuted],
  );

  return (
    <button
      onMouseEnter={() => playHoverSound()}
      onClick={toggleMute}
      aria-label={muted ? "Unmute" : "Mute"}
      data-link
      className={`opacity-90 hover:opacity-100 transition-opacity cursor-pointer ${className} z-90 position-relative`}
    >
      {muted ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Speaker body (filled) */}
          <polygon points="3,8 8,8 13,3 13,21 8,16 3,16" fill="currentColor" />
          {/* X mark */}
          <line
            x1="16"
            y1="8"
            x2="22"
            y2="16"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="square"
          />
          <line
            x1="22"
            y1="8"
            x2="16"
            y2="16"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="square"
          />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Speaker body (filled) */}
          <polygon points="3,8 8,8 13,3 13,21 8,16 3,16" fill="currentColor" />
          {/* Sound waves (angular chevrons) */}
          <path
            d="M16 9 L18 12 L16 15"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
            fill="none"
          />
          <path
            d="M19 6 L22 12 L19 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
            fill="none"
          />
        </svg>
      )}
    </button>
  );
}

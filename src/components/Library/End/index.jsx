import { useStore } from "@/store/useStore";
import { useState, useRef, useEffect } from "react";
import { useLenis } from "lenis/react";
import { gsap } from "@/lib/gsap";

export default function End() {
  const { setTransition } = useStore();
  const [end, setEnd] = useState(false);
  const endRef = useRef(null);
  const endStateRef = useRef(false);

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
    gsap.to(endRef.current, {
      opacity: end ? 1 : 0,
      y: end ? 0 : 10,
      duration: 0.4,
      ease: "power2.out",
    });
  }, [end]);

  const handleClick = () => {
    gsap.to(endRef.current, {
      opacity: 0,
      y: 10,
      duration: 0.4,
      overwrite: true,
      ease: "power2.out",
    });
    setTransition("next");
  };

  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2">
      <div
        ref={endRef}
        className="cursor-pointer relative uppercase text-[2rem] font-[800] pointer-events-auto border-b-1 px-2 py-1 group opacity-0"
        onClick={handleClick}
      >
        <span className="relative z-1">next</span>
        <span className="border-1 border-b-0 absolute z-0 bg-bg-blue w-full h-full left-0 bottom-0 scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-300" />
      </div>
    </div>
  );
}

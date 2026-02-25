import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useLenis } from "lenis/react";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/router";
export default function Footer() {
  const nextRef = useRef(null);
  const endRef = useRef(false);
  const [end, setEnd] = useState(false);
  const { setTransition } = useStore();
  const { asPath } = useRouter();

  useGSAP(() => {
    if (!nextRef.current) return;

    gsap.set(nextRef.curren, {
      autoAlpha: 0,
      y: 20,
    });
  }, []);

  useGSAP(() => {
    if (!nextRef.current) return;

    gsap.to(nextRef.current, {
      autoAlpha: end ? 1 : 0,
      y: end ? 0 : 20,
      duration: end ? 0.5 : 0.3,
      ease: end ? "power2.out" : "power2.in",
      overwrite: true,
    });
  }, [end]);

  useLenis(({ progress }) => {
    if (progress >= 0.9 && !endRef.current) {
      endRef.current = true;
      setEnd(true);
    } else if (progress < 0.9 && endRef.current) {
      endRef.current = false;
      setEnd(false);
    }
  });

  return (
    <footer className="fixed bottom-0 left-0 w-full p-2 z-12 flex justify-center items-center">
      {asPath !== "/year" && (
        <span
          ref={nextRef}
          className="cursor-pointer"
          onClick={() => {
            setTransition("next");
          }}
        >
          next year
        </span>
      )}
    </footer>
  );
}

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useLenis } from "lenis/react";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/router";
export default function Footer() {
  const nextRef = useRef(null);
  const info = useRef([]);
  const endRef = useRef(false);
  const [end, setEnd] = useState(false);
  const { setTransition } = useStore();
  const { asPath } = useRouter();

  useGSAP(() => {
    if (!nextRef.current) return;

    gsap.set([nextRef.current, info.current], {
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

  useGSAP(
    () => {
      if (!info.current) return;

      if (asPath === "/year") {
        gsap.to(info.current[0], {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          overwrite: true,
        });
      } else {
        gsap.to(info.current[0], {
          autoAlpha: 0,
          y: 20,
          duration: 0.3,
          ease: "power2.in",
          overwrite: true,
        });
      }
    },
    { dependencies: [asPath] },
  );

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
      <span ref={(el) => (info.current[0] = el)}>
        Click or swipe to turn the page
      </span>
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

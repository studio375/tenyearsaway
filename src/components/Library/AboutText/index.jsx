import { useRef, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { gsap, SplitText } from "@/lib/gsap";
import { useRouter } from "next/router";

export default function AboutText() {
  const leftRef = useRef();
  const rightRef = useRef();
  const splitLeftRef = useRef(null);
  const splitRightRef = useRef(null);
  const tl = useRef(null);
  const prevActiveRef = useRef(false);

  const active = useStore((state) => state.active);
  const loaded = useStore((state) => state.loaded);

  const router = useRouter();
  const isAbout = router.asPath.startsWith("/about");

  useEffect(() => {
    gsap.set([leftRef.current, rightRef.current], { opacity: 0 });
  }, []);

  useEffect(() => {
    if (!loaded) return;

    tl.current?.kill();
    splitLeftRef.current?.revert();
    splitRightRef.current?.revert();
    splitLeftRef.current = null;
    splitRightRef.current = null;

    if (isAbout && active) {
      const entryDelay = prevActiveRef.current ? 0.3 : 1.2;

      splitLeftRef.current = new SplitText(leftRef.current, {
        type: "words",
        wordsClass: "word",
      });
      splitRightRef.current = new SplitText(rightRef.current, {
        type: "words",
        wordsClass: "word",
      });

      gsap.set([splitLeftRef.current.words, splitRightRef.current.words], {
        opacity: 0,
        y: 20,
      });
      gsap.set([leftRef.current, rightRef.current], { opacity: 1 });

      tl.current = gsap.timeline({ delay: entryDelay });
      tl.current
        .to(
          splitLeftRef.current.words,
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.06,
            ease: "power3.out",
          },
          0,
        )
        .to(
          splitRightRef.current.words,
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.06,
            ease: "power3.out",
          },
          0.1,
        );
    } else if (active) {
      tl.current = gsap.timeline();
      tl.current.to([leftRef.current, rightRef.current], {
        y: -15,
        opacity: 0,
        duration: 0.6,
        ease: "power3.in",
        stagger: 0.05,
      });
    }

    prevActiveRef.current = active;

    return () => {
      tl.current?.kill();
      splitLeftRef.current?.revert();
      splitRightRef.current?.revert();
      splitLeftRef.current = null;
      splitRightRef.current = null;
    };
  }, [isAbout, active, loaded]);

  return (
    <>
      <div
        ref={leftRef}
        className="fixed lg:top-[8rem] top-[10rem] md:top-[15rem] left-[2.4rem] z-10 lg:max-w-[22rem] max-w-full pr-2 pointer-events-none opacity-0"
      >
        <p className="lg:text-[1.3rem] text-[1.1rem] lg:leading-[1.6] leading-[1.3] uppercase font-medium text-storm m-0">
          Ten Years Away è un fumetto interattivo che racconta dieci anni di
          storia attraverso le persone che hanno preso parte a questo
          straordinario viaggio.
        </p>
      </div>
      <div
        ref={rightRef}
        className="fixed bottom-2 left-[2rem] lg:bottom-auto lg:left-auto  lg:top-[8rem] lg:right-[2.4rem] z-10 lg:max-w-[22rem] max-w-[78vw] lg:text-right text-left pointer-events-none opacity-0"
      >
        <p className="text-[1.1rem] lg:text-[1.3rem] lg:leading-[1.6] leading-[1.3] uppercase font-medium text-storm m-0">
          Studio375 è un'agenzia di comunicazione, grafica e web con sede a
          Vicenza. Illustrazioni di Davide Grazi.
        </p>
      </div>
    </>
  );
}

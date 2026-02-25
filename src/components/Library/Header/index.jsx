import Link from "next/link";
import Title from "../Title";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/router";
export default function Header() {
  const menu = useRef([]);
  const box = useRef(null);
  const startRef = useRef(null);
  const { active, loaded } = useStore();
  const router = useRouter();
  useEffect(() => {
    if (!loaded) return;

    if (!active) {
      gsap.to(startRef.current, {
        autoAlpha: 1,
        yPercent: 0,
        y: 0,
        duration: 1.4,
        delay: 0.7,
        ease: "power4.inOut",
      });

      const handleClick = () => {
        gsap.to(startRef.current, {
          autoAlpha: 0,
          yPercent: 10,
          y: 0,
          duration: 1.4,
          overwrite: true,
          ease: "power4.inOut",
        });
        router.push("/year/2015").then(() => {
          document.removeEventListener("click", handleClick);
        });
      };
      document.addEventListener("click", handleClick);
      return () => {
        document.removeEventListener("click", handleClick);
      };
    } else {
      gsap.to(startRef.current, {
        autoAlpha: 0,
        yPercent: 10,
        y: 0,
        duration: 1.4,
        ease: "power4.inOut",
      });
    }
  }, [loaded, active]);

  useEffect(() => {
    const tl = gsap.timeline();
    if (active) {
      gsap.set([menu.current, box.current], {
        opacity: 0,
        yPercent: 100,
        y: 100,
      });
      tl.to(box.current, {
        opacity: 1,
        yPercent: 0,
        y: 0,
        duration: 1,
        delay: 1.3,
        ease: "expo-hard",
      }).to(
        menu.current,
        {
          opacity: 1,
          yPercent: 0,
          y: 0,
          duration: 1,
          ease: "power4.inOut",
        },
        "<",
      );
    } else {
      tl.to(menu.current, {
        opacity: 0,
        yPercent: 100,
        y: 0,
        duration: 1,
        delay: 0,
        ease: "expo-hard",
      }).to(
        box.current,
        {
          opacity: 0,
          yPercent: 100,
          y: 0,
          duration: 1,
          delay: 0.1,
          ease: "power4.inOut",
        },
        "<",
      );
    }

    return () => {
      tl?.kill();
    };
  }, [active]);

  return (
    <header className="fixed bottom-0 left-0 w-full p-0 z-12 flex justify-center items-center gap-2 font-bold uppercase text-[2rem]">
      <div className="flex justify-center items-center absolute bottom-4 left-1/2 -translate-x-1/2">
        <span
          ref={startRef}
          className="text-[1.5rem] lowercase tracking-widest text-white opacity-0 translate-y-3"
        >
          <span className="animate-pulse">click everywhere to start</span>
        </span>
      </div>
      <div
        ref={box}
        className="opacity-0 translate-y-100 cardBox inline-flex justify-center items-center w-auto bg-background p-2 rounded-tl-[12px] rounded-tr-[12px] border-2 border-black border-b-0 text-text-color"
      >
        <span
          ref={(el) => (menu.current[0] = el)}
          className="opacity-0 translate-y-100"
        >
          <Link
            href="/year"
            className="text-stroke-black text-stroke-0.8"
            style={{
              WebkitTextStroke: "0.8px black",
              textStroke: "0.8px black",
            }}
          >
            Years
          </Link>
        </span>
        <div className="w-20 flex justify-center items-center" />
        <span
          ref={(el) => (menu.current[2] = el)}
          className="opacity-0 translate-y-100"
        >
          <Link
            href="/about"
            className="text-stroke-black text-stroke-0.8"
            style={{
              WebkitTextStroke: "0.8px black",
              textStroke: "0.8px black",
            }}
          >
            About
          </Link>
        </span>
      </div>
      <Title />
    </header>
  );
}

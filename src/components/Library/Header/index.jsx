import { useRef, useEffect } from "react";
import { useStore } from "@/store/useStore";
import gsap from "gsap";
import { useRouter } from "next/router";
import Title from "../Title";
import Link from "next/link";

export default function Header() {
  const box = useRef();
  const menu = useRef([]);
  const hoverBgLeft = useRef();
  const hoverBgRight = useRef();
  const active = useStore((state) => state.active);

  const router = useRouter();
  const isVisible = useRef(false);

  useEffect(() => {
    gsap.set(hoverBgLeft.current, {
      scaleX: 0,
      transformOrigin: "right center",
    });
    gsap.set(hoverBgRight.current, {
      scaleX: 0,
      transformOrigin: "left center",
    });
  }, []);

  useEffect(() => {
    const tl = gsap.timeline();
    if (active && router.asPath !== "/" && !isVisible.current) {
      isVisible.current = true;
      tl.to(box.current, {
        opacity: 1,
        yPercent: 0,
        y: 0,
        duration: 1,
        delay: 0.2,
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
    }
    if (router.asPath == "/") {
      isVisible.current = false;
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
  }, [active, router.asPath]);

  const handleEnterLeft = () => {
    gsap.to(hoverBgLeft.current, {
      scaleX: 1,
      duration: 0.5,
      ease: "power3.out",
    });
  };
  const handleLeaveLeft = () =>
    gsap.to(hoverBgLeft.current, {
      scaleX: 0,
      duration: 0.5,
      overwrite: true,
      ease: "power3.in",
    });
  const handleEnterRight = () => {
    gsap.to(hoverBgRight.current, {
      scaleX: 1,
      duration: 0.5,
      ease: "power3.out",
    });
  };
  const handleLeaveRight = () =>
    gsap.to(hoverBgRight.current, {
      scaleX: 0,
      duration: 0.5,
      overwrite: true,
      ease: "power3.in",
    });

  return (
    <header className="fixed top-2 left-0 w-full p-0 z-12 flex justify-center items-center uppercase text-[1.4rem] font-500">
      <div
        ref={box}
        className="opacity-0 translate-y-100 inline-flex justify-center items-center w-auto h-[3.3rem]"
      >
        <div
          ref={(el) => (menu.current[0] = el)}
          onMouseEnter={handleEnterLeft}
          onMouseLeave={handleLeaveLeft}
          className="relative opacity-0 translate-y-100 w-22 h-full flex justify-start items-center will-change-transform pl-3 border-b-1 rounded-tl-[3px] overflow-hidden"
        >
          <div
            ref={hoverBgLeft}
            className="absolute inset-0 bg-bg-blue border-1 border-b-0"
          />
          <Link
            href="/year"
            className="relative z-10 w-full h-full flex justify-start items-center"
          >
            Years
          </Link>
        </div>
        <div
          ref={(el) => (menu.current[2] = el)}
          onMouseEnter={handleEnterRight}
          onMouseLeave={handleLeaveRight}
          className="relative opacity-0 translate-y-100 w-22 h-full flex justify-end items-center will-change-transform pr-3 border-b-1 rounded-tr-[3px] overflow-hidden"
        >
          <div
            ref={hoverBgRight}
            className="absolute inset-0 bg-bg-blue border-1 border-b-0"
          />
          <Link
            href="/about"
            className="relative z-10 w-full h-full flex justify-end items-center"
          >
            About
          </Link>
        </div>
      </div>
      <Title />
    </header>
  );
}

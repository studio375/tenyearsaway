import { useRef, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { gsap } from "@/lib/gsap";
import { useRouter } from "next/router";
import Title from "../Title";
import Link from "next/link";

export default function Header() {
  const box = useRef();
  const menu = useRef([]);
  const currentYear = useRef();
  const hoverBgLeft = useRef();
  const hoverBgRight = useRef();
  const active = useStore((state) => state.active);
  const pageData = useStore((state) => state.page);
  const activeYear = useStore((state) => state.activeYear);
  const transition = useStore((state) => state.transition);

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

  useEffect(() => {
    if (!currentYear.current) return;
    const tl = gsap.timeline();
    const p = currentYear.current.querySelectorAll("p");
    if (
      (router.asPath.startsWith("/year/") && !useStore.getState().transition) ||
      !useStore.getState().transition == "exit"
    ) {
      gsap.set(p, {
        y: 10,
        yPercent: 0,
        opacity: 0,
      });
      tl.to(p, {
        opacity: 1,
        y: 0,
        yPercent: 0,
        duration: 0.5,
        overwrite: true,
        ease: "power2.out",
        stagger: 0.12,
        delay: useStore.getState().loaded ? 1.5 : 6.34,
      });
    } else {
      if (
        !router.asPath.startsWith("/year/") ||
        useStore.getState().transition == "next"
      ) {
        tl.to(p, {
          opacity: 0,
          y: 10,
          yPercent: 0,
          duration: 0.5,
          overwrite: true,
          ease: "power2.out",
          stagger: 0.12,
        });
      }
    }
    return () => {
      tl?.kill();
    };
  }, [router.asPath, activeYear]);

  useEffect(() => {
    const isYearPage = router.asPath == "/year";
    const isAboutPage = router.asPath.startsWith("/about");
    gsap.to(hoverBgLeft?.current, {
      scaleX: isYearPage ? 1 : 0,
      duration: 0.5,
      overwrite: true,
      ease: "power3.out",
    });
    gsap.to(hoverBgRight?.current, {
      scaleX: isAboutPage ? 1 : 0,
      duration: 0.5,
      overwrite: true,
      ease: "power3.out",
    });
  }, [router.asPath]);

  const handleEnterLeft = () => {
    gsap.to(hoverBgLeft.current, {
      scaleX: 1,
      duration: 0.5,
      ease: "power3.out",
    });
  };
  const handleLeaveLeft = () => {
    if (router.asPath.startsWith("/year")) return;
    gsap.to(hoverBgLeft.current, {
      scaleX: 0,
      duration: 0.5,
      overwrite: true,
      ease: "power3.in",
    });
  };
  const handleEnterRight = () => {
    gsap.to(hoverBgRight.current, {
      scaleX: 1,
      duration: 0.5,
      ease: "power3.out",
    });
  };
  const handleLeaveRight = () => {
    if (router.asPath.startsWith("/about")) return;
    gsap.to(hoverBgRight?.current, {
      scaleX: 0,
      duration: 0.5,
      overwrite: true,
      ease: "power3.in",
    });
  };

  return (
    <header className="fixed top-[10px] md:top-2 left-0 w-full p-0 z-12 flex justify-center items-center uppercase text-[1.4rem] font-500">
      {activeYear && (
        <div
          className={`text-[1.2rem] lg:text-[1.4rem] absolute fixed top-9 lg:top-4 left-[2rem] lg:left-[2.4rem] flex lg:gap-2 gap-1`}
          ref={currentYear}
        >
          <p className="font-medium uppercase m-0 opacity-0 will-change-transform">
            Year {Math.abs(2015 - parseInt(activeYear)) ?? ""}
          </p>
          <p className="font-bold mx-0 opacity-0  will-change-transform">
            {activeYear ?? ""}
          </p>
          <p className="font-medium uppercase m-0 opacity-0 will-change-transform">
            {pageData?.[2] ?? ""}
          </p>
        </div>
      )}
      <div
        ref={box}
        className="opacity-0 translate-y-100 inline-flex justify-center items-center w-auto h-[2.5rem] md:h-[3.8rem]"
      >
        <div
          ref={(el) => (menu.current[0] = el)}
          onMouseEnter={handleEnterLeft}
          onMouseLeave={handleLeaveLeft}
          className="relative opacity-0 translate-y-100 md:w-22 w-17 h-full flex justify-start items-center will-change-transform pl-3 border-b-1 rounded-tl-[3px] overflow-hidden"
        >
          <div
            ref={hoverBgLeft}
            className="absolute inset-0 bg-bg-blue border-1 border-b-0"
          />
          <Link
            href="/year"
            className="relative z-10 w-full h-full flex justify-start items-center max-md:text-[1.14rem] max-md:leading-[1.3]"
          >
            Years
          </Link>
        </div>
        <div
          ref={(el) => (menu.current[2] = el)}
          onMouseEnter={handleEnterRight}
          onMouseLeave={handleLeaveRight}
          className="relative opacity-0 translate-y-100 md:w-22 w-17 h-full flex justify-end items-center will-change-transform pr-3 border-b-1 rounded-tr-[3px] overflow-hidden"
        >
          <div
            ref={hoverBgRight}
            className="absolute inset-0 bg-bg-blue border-1 border-b-0"
          />
          <Link
            href="/about"
            className="relative z-10 w-full h-full flex justify-end items-center max-md:text-[1.14rem] max-md:leading-[1.3]"
          >
            About
          </Link>
        </div>
      </div>
      <Title />
    </header>
  );
}

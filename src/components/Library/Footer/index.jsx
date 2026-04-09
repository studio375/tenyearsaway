import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/router";
import Link from "next/link";
export default function Footer() {
  const startRef = useRef(null);
  const infoRef = useRef([]);
  const { active, loaded } = useStore();
  const router = useRouter();
  useEffect(() => {
    if (!loaded) return;
    const tl = gsap.timeline();
    if (!active) {
      gsap.set(infoRef.current, { autoAlpha: 0 });
      gsap.to(startRef.current, {
        autoAlpha: 1,
        yPercent: 0,
        y: 0,
        duration: 1.2,
        delay: 0.2,
        ease: "power2.out",
      });

      const handleClick = () => {
        gsap.to(startRef.current, {
          autoAlpha: 0,
          yPercent: 10,
          y: 0,
          duration: 1.2,
          overwrite: true,
          ease: "power2.out",
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
        duration: 0.8,
        ease: "power2.out",
      });
      tl.to(infoRef.current[0], {
        autoAlpha: 1,
        yPercent: 0,
        y: 0,
        duration: 1,
        delay: 0.23,
        ease: "power2.out",
      }).to(
        infoRef.current[1],
        {
          autoAlpha: 1,
          yPercent: 0,
          y: 0,
          duration: 1,
          ease: "power2.out",
        },
        "<",
      );
    }

    return () => {
      tl?.kill();
    };
  }, [loaded, active]);

  useEffect(() => {
    if (router.asPath === "/") {
      gsap.to(infoRef.current, {
        autoAlpha: 0,
        yPercent: 100,
        y: 0,
      });
    }
  }, [router.asPath]);

  return (
    <footer className="fixed bottom-0 left-0 w-full lgx:h-5 h-auto z-12 flex justify-center items-center font-500 text-[1.2rem] lg:px-5 px-[2rem]">
      <div className="flex justify-center items-center absolute lgx:top-1/2 bottom-[10.5rem] md:bottom-[16rem] lg:bottom-[4rem] lgx:bottom-auto left-1/2 -translate-x-1/2 lgx:-translate-y-1/2">
        <span
          ref={startRef}
          className="lowercase text-text-blue opacity-0 translate-y-3 will-change-transform"
        >
          <span className="animate-pulse">click everywhere to start</span>
        </span>
      </div>
      <div
        ref={(el) => (infoRef.current[0] = el)}
        className="opacity-0 translate-y-100 lg:block hidden pb-2 lgx:pb-0"
      >
        TEN YEARS AWAY...one year later... ops: a grapghic novel, of a true
        story, based on... us.
      </div>
      <div
        ref={(el) => (infoRef.current[1] = el)}
        className="opacity-0 text-right absolute lg:right-5 right-[2rem] translate-y-100 bottom-[1.9rem] lg:bottom-2 lgx:bottom-[2.5] lgx:bottom-auto"
      >
        <Link href="https://375.studio" target="_blank">
          375.studio
        </Link>
      </div>
    </footer>
  );
}

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/lib/gsap";
import { useRouter } from "next/router";

export default function Home() {
  const loaded = useStore((state) => state.loaded);
  const transition = useStore((state) => state.transition);
  const path1Ref = useRef(null);
  const path2Ref = useRef(null);
  const leftTextRef = useRef(null);
  const rightTextRef = useRef(null);
  const router = useRouter();
  const [isHome, setIsHome] = useState(router.pathname === "/");

  useEffect(() => {
    if (!isHome) return;

    if (!loaded || transition) {
      return;
    }

    gsap.to([path1Ref.current, path2Ref.current], {
      strokeDashoffset: 0,
      opacity: 1,
      duration: 2.6,
      delay: 0.2,
      stagger: 0.3,
      ease: "power1.inOut",
    });

    const splitLeft = new SplitText(leftTextRef.current, { type: "words" });
    const splitRight = new SplitText(rightTextRef.current, { type: "words" });

    gsap.set([leftTextRef.current, rightTextRef.current], { opacity: 1 });

    gsap.from(splitLeft.words, {
      y: 20,
      opacity: 0,
      duration: 0.9,
      delay: 0.4,
      stagger: 0.06,
      ease: "power3.out",
    });

    gsap.from(splitRight.words, {
      y: -20,
      opacity: 0,
      duration: 0.9,
      delay: 0.6,
      stagger: 0.08,
      ease: "power3.out",
    });

    return () => {
      splitLeft.revert();
      splitRight.revert();
    };
  }, [loaded, isHome, transition]);

  useEffect(() => {
    const handleStart = () => {
      if (router.pathname !== "/") return;

      gsap.to([leftTextRef.current, rightTextRef.current], {
        opacity: 0,
        y: -15,
        duration: 0.45,
        delay: 0.12,
        ease: "power2.in",
      });

      gsap.to([path1Ref.current, path2Ref.current], {
        opacity: 0,
        duration: 0.6,
        overwrite: true,
        ease: "power2.out",
      });

      setTimeout(() => setIsHome(false), 800);
    };

    const handleComplete = (url) => {
      if (url === "/") setIsHome(true);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
    };
  }, [router]);

  if (!isHome) return null;

  const pathStyle = {
    fill: "none",
    fillRule: "nonzero",
    stroke: "#cce8eb",
    strokeWidth: "2px",
    strokeDasharray: 1,
    strokeDashoffset: 1,
  };

  return (
    <div>
      <main className="relative z-1 h-screen w-screen">
        <div className="pt-[18vh] lgx:px-5 px-[2rem]  flex justify-between items-start flex-wrap">
          <div className="lgx:pl-[8rem] md:pl-[5rem]">
            <p
              ref={leftTextRef}
              className="text-text-blue text-[2rem] font-[200] xl:w-[10vw] lgx:w-[13vw] md:w-[16vw] sm:w-[20vw] w-full opacity-0"
            >
              A graphic novel, of a true story, based on... us.
            </p>
          </div>
          <div>
            <p
              ref={rightTextRef}
              className="font-[500] italic text-[#cce8eb] text-[2rem] -mt-[2rem] opacity-0"
            >
              ...one year later... opss
            </p>
          </div>
        </div>
        <div className="fixed bottom-[2rem] lgx:bottom-[5rem] left-0 right-0 px-[2rem] lgx:px-[50px] pointer-events-none lg:block hidden">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1827 752"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              fillRule: "evenodd",
              clipRule: "evenodd",
              strokeLinecap: "round",
            }}
          >
            <path
              ref={path1Ref}
              pathLength="1"
              d="M1.447,1l0,637m512,108l400.003,0m-908.902,-0.189l0,-30.791l78.571,-60.324c4.412,-3.561 7.773,-7.541 7.773,-11.73c0,-6.912 -7.353,-10.263 -16.176,-10.263c-11.975,0 -26.681,7.959 -26.681,30.371l-45.588,-24.297c9.244,-26.811 37.185,-43.777 72.269,-43.777c39.916,0 64.916,17.804 64.916,46.081c0,9.216 -1.89,21.993 -18.067,34.77l-8.823,6.913c-15.757,12.567 -26.681,16.547 -47.27,16.547l-18.697,0l0,8.797l95.588,0l0,37.703l-137.815,0Zm222.32,4.189c-46.008,0 -76.05,-31 -76.05,-77.5c0,-46.5 30.042,-77.291 76.05,-77.291c46.219,0 76.051,30.791 76.051,77.291c0,46.5 -29.832,77.5 -76.051,77.5Zm0,-38.959c17.017,0 27.731,-15.71 27.731,-38.541c0,-22.831 -10.714,-38.541 -27.731,-38.541c-17.017,0 -27.731,15.5 -27.731,38.541c0,22.831 10.714,38.541 27.731,38.541Zm170.822,-111.852l0,146.622l-46.219,0l0,-119.602l-7.983,0l0,2.723c0,20.109 -4.412,30.163 -19.748,43.987l-8.824,7.959l0,-46.29l39.076,-35.399l43.698,0Zm84.216,150.811c-34.664,0 -62.185,-14.453 -72.059,-38.541l43.487,-24.297c0.84,17.595 15.756,25.135 28.151,25.135c13.236,0 23.11,-8.588 23.11,-20.317c0,-11.73 -9.664,-19.689 -22.9,-19.689c-11.134,0 -18.907,5.445 -25.42,13.405l-43.277,-5.027l14.286,-81.48l121.849,0l0,37.703l-112.606,0l0,8.378c15.967,0.419 22.479,7.96 21.849,22.412l8.403,1.048c2.311,-10.683 11.765,-24.088 35.925,-24.088c30.462,0 50.63,19.48 50.63,47.757c0,35.817 -28.781,57.601 -71.428,57.601Z"
              style={pathStyle}
            />
            <path
              ref={path2Ref}
              pathLength="1"
              d="M913.448,746l314.003,0m593.999,-146l0,-580m-593.9,725.811l0,-30.791l78.57,-60.324c4.41,-3.561 7.77,-7.541 7.77,-11.73c0,-6.912 -7.35,-10.263 -16.17,-10.263c-11.98,0 -26.68,7.959 -26.68,30.371l-45.59,-24.297c9.24,-26.811 37.18,-43.777 72.27,-43.777c39.91,0 64.91,17.804 64.91,46.081c0,9.216 -1.89,21.993 -18.06,34.77l-8.83,6.913c-15.75,12.567 -26.68,16.547 -47.27,16.547l-18.69,0l0,8.797l95.58,0l0,37.703l-137.81,0Zm222.32,4.189c-46.01,0 -76.05,-31 -76.05,-77.5c0,-46.5 30.04,-77.291 76.05,-77.291c46.22,0 76.05,30.791 76.05,77.291c0,46.5 -29.83,77.5 -76.05,77.5Zm0,-38.959c17.01,0 27.73,-15.71 27.73,-38.541c0,-22.831 -10.72,-38.541 -27.73,-38.541c-17.02,0 -27.73,15.5 -27.73,38.541c0,22.831 10.71,38.541 27.73,38.541Zm86.65,34.77l0,-30.791l78.57,-60.324c4.41,-3.561 7.77,-7.541 7.77,-11.73c0,-6.912 -7.35,-10.263 -16.17,-10.263c-11.98,0 -26.68,7.959 -26.68,30.371l-45.59,-24.297c9.24,-26.811 37.18,-43.777 72.27,-43.777c39.91,0 64.91,17.804 64.91,46.081c0,9.216 -1.89,21.993 -18.06,34.77l-8.83,6.913c-15.75,12.567 -26.68,16.547 -47.27,16.547l-18.69,0l0,8.797l95.58,0l0,37.703l-137.81,0Zm217.01,4.189c-34.67,0 -62.19,-14.453 -72.06,-38.541l43.49,-24.297c0.84,17.595 15.75,25.135 28.15,25.135c13.23,0 23.11,-8.588 23.11,-20.317c0,-11.73 -9.67,-19.689 -22.9,-19.689c-11.14,0 -18.91,5.445 -25.42,13.405l-43.28,-5.027l14.29,-81.48l121.85,0l0,37.703l-112.61,0l0,8.378c15.97,0.419 22.48,7.96 21.85,22.412l8.4,1.048c2.31,-10.683 11.77,-24.088 35.93,-24.088c30.46,0 50.63,19.48 50.63,47.757c0,35.817 -28.78,57.601 -71.43,57.601Z"
              style={pathStyle}
            />
          </svg>
        </div>
      </main>
    </div>
  );
}

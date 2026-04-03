import { gsap } from "@/lib/gsap";
import { useStore } from "@/store/useStore";
import { useEffect, useRef } from "react";

export default function BookLabels() {
  const pages = useStore((s) => s.pages);
  const bookCurrentPage = useStore((s) => s.bookCurrentPage);
  const active = useStore((s) => s.active);
  const selectedPage = useStore((s) => s.selectedPage);
  const setSelectedPage = useStore((s) => s.setSelectedPage);

  // Ref maps: pageIndex -> DOM element
  const leftElsRef = useRef({});
  const rightElsRef = useRef({});
  const prevPageRef = useRef(false);
  const infoRef = useRef(null);
  const pageTl = useRef(null);

  const totalSheets = pages ? Math.ceil((pages.length + 2) / 2) : 0;
  const isOpen =
    bookCurrentPage !== false &&
    bookCurrentPage > 0 &&
    bookCurrentPage < totalSheets &&
    active &&
    selectedPage === false;

  // In/Out — quando il libro si apre o si chiude
  useEffect(() => {
    if (isOpen) {
      const leftIdx = 2 * (bookCurrentPage - 1);
      const rightIdx = 2 * bookCurrentPage - 1;
      const leftEl = leftElsRef.current[leftIdx];
      const rightEl = rightElsRef.current[rightIdx];
      prevPageRef.current = bookCurrentPage;

      if (leftEl) {
        gsap.killTweensOf(leftEl);
        gsap.fromTo(
          leftEl,
          { x: -24, opacity: 0, pointerEvents: "none" },
          {
            x: 0,
            opacity: 1,
            pointerEvents: "auto",
            duration: 0.8,
            ease: "power3.out",
            delay: 0.5,
          },
        );
      }
      if (rightEl) {
        gsap.killTweensOf(rightEl);
        gsap.fromTo(
          rightEl,
          { x: 24, opacity: 0, pointerEvents: "none" },
          {
            x: 0,
            opacity: 1,
            pointerEvents: "auto",
            duration: 0.8,
            ease: "power3.out",
            delay: 0.5,
          },
        );
      }
    } else {
      // Usa prevPageRef per trovare gli elementi che erano visibili
      if (prevPageRef.current === false) return;
      const leftIdx = 2 * (prevPageRef.current - 1);
      const rightIdx = 2 * prevPageRef.current - 1;
      const leftEl = leftElsRef.current[leftIdx];
      const rightEl = rightElsRef.current[rightIdx];

      if (leftEl) {
        gsap.killTweensOf(leftEl);
        gsap.to(leftEl, {
          x: -24,
          opacity: 0,
          pointerEvents: "none",
          duration: 1.2,
          ease: "power2.in",
        });
      }
      if (rightEl) {
        gsap.killTweensOf(rightEl);
        gsap.to(rightEl, {
          x: 24,
          opacity: 0,
          pointerEvents: "none",
          duration: 1.2,
          ease: "power2.in",
        });
      }
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Info hint
  useEffect(() => {
    if (!infoRef.current) return;
    const tl = gsap.timeline();
    if (active) {
      tl.to(infoRef.current, {
        opacity: 1,
        yPercent: 0,
        y: 0,
        duration: 1,
        delay: useStore.getState().loaded ? 1.4 : 0.4,
        ease: "power2.out",
      });
    } else {
      tl.to(infoRef.current, {
        opacity: 0,
        yPercent: 10,
        y: 0,
        delay: useStore.getState().loaded ? 1.4 : 0.8,
        duration: 1,
        ease: "power2.in",
      });
    }
    return () => tl.kill();
  }, [active]);

  useEffect(() => {
    if (
      !isOpen ||
      bookCurrentPage === false ||
      bookCurrentPage === prevPageRef.current
    )
      return;

    const prevPage = prevPageRef.current;
    prevPageRef.current = bookCurrentPage;

    const prevLeftIdx = prevPage !== false ? 2 * (prevPage - 1) : -1;
    const prevRightIdx = prevPage !== false ? 2 * prevPage - 1 : -1;
    const nextLeftIdx = 2 * (bookCurrentPage - 1);
    const nextRightIdx = 2 * bookCurrentPage - 1;

    const prevLeftEl = leftElsRef.current[prevLeftIdx];
    const prevRightEl = rightElsRef.current[prevRightIdx];
    const nextLeftEl = leftElsRef.current[nextLeftIdx];
    const nextRightEl = rightElsRef.current[nextRightIdx];

    pageTl.current?.kill();
    pageTl.current = gsap.timeline();

    // Out: vecchie label
    if (prevLeftEl)
      pageTl.current.to(
        prevLeftEl,
        {
          x: -20,
          opacity: 0,
          pointerEvents: "none",
          duration: 0.25,
          ease: "power2.in",
        },
        0,
      );
    if (prevRightEl)
      pageTl.current.to(
        prevRightEl,
        {
          x: 20,
          opacity: 0,
          pointerEvents: "none",
          duration: 0.25,
          ease: "power2.in",
        },
        0,
      );

    // In: nuove label
    if (nextLeftEl)
      pageTl.current.fromTo(
        nextLeftEl,
        { x: -20, opacity: 0, pointerEvents: "none" },
        {
          x: 0,
          opacity: 1,
          pointerEvents: "auto",
          duration: 0.55,
          ease: "power3.out",
        },
        0.25,
      );
    if (nextRightEl)
      pageTl.current.fromTo(
        nextRightEl,
        { x: 20, opacity: 0, pointerEvents: "none" },
        {
          x: 0,
          opacity: 1,
          pointerEvents: "auto",
          duration: 0.55,
          ease: "power3.out",
        },
        0.25,
      );
  }, [bookCurrentPage, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pages) return null;

  return (
    <>
      <div className="fixed left-0 top-0 h-full pointer-events-none z-10 w-1/4">
        {pages.map((page, i) => {
          if (i % 2 !== 0) return null;
          const sheetNum = i / 2 + 1;
          return (
            <div
              key={i}
              ref={(el) => {
                leftElsRef.current[i] = el;
              }}
              onClick={() =>
                isOpen &&
                bookCurrentPage === sheetNum &&
                setSelectedPage(sheetNum - 1)
              }
              className="opacity-0 pointer-events-none absolute inset-0 group cursor-pointer pl-[8vw] text-left flex flex-col justify-center w-full"
            >
              <p className="block text-transparent bg-clip-text bg-[length:200%_100%] transition-all duration-300 bg-gradient-to-r from-bg-blue from-50% to-text-color to-50% bg-left group-hover:bg-right uppercase text-[9vw] leading-[7vw] font-extrabold absolute -left-[1vw] top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] rotate-180 h-full text-center">
                {`Year ${i}`}
              </p>
              <p className="text-[1.4rem] font-medium uppercase mt-[0.6rem] mb-[0.2rem] mx-0">
                {page.title}
              </p>
              <p className="text-[1.4rem] font-medium uppercase m-0">
                {page.year}
              </p>
            </div>
          );
        })}
      </div>

      <div className="fixed right-0 top-0 h-full pointer-events-none z-10 w-1/4">
        {pages.map((page, i) => {
          if (i % 2 !== 1) return null;
          const sheetNum = Math.ceil(i / 2);
          return (
            <div
              key={i}
              ref={(el) => {
                rightElsRef.current[i] = el;
              }}
              onClick={() =>
                isOpen &&
                bookCurrentPage === sheetNum &&
                setSelectedPage(sheetNum)
              }
              className="opacity-0 pointer-events-none absolute inset-0 group cursor-pointer pr-[8vw] text-right flex flex-col justify-center w-full"
            >
              <p className="block text-transparent bg-clip-text bg-[length:200%_100%] transition-all duration-300 bg-gradient-to-r from-text-color from-50% to-bg-blue to-50% bg-right group-hover:bg-left uppercase text-[9vw] leading-[7vw] font-extrabold absolute -right-[1vw] top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] rotate-180 h-full text-center">
                {`Year ${i}`}
              </p>
              <p className="text-[1.4rem] font-medium uppercase mt-[0.6rem] mb-[0.2rem] mx-0">
                {page.title}
              </p>
              <p className="text-[1.4rem] font-medium uppercase m-0">
                {page.year}
              </p>
            </div>
          );
        })}
      </div>

      <div
        ref={infoRef}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 pointer-events-none select-none opacity-0 translate-y-10"
      >
        <p className="text-[1.8rem] lowercase font-medium">
          Swipe to turn pages
        </p>
      </div>
    </>
  );
}

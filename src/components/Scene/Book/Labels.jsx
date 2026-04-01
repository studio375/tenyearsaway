import { gsap } from "@/lib/gsap";
import { useStore } from "@/store/useStore";
import { useEffect, useRef, useMemo } from "react";

function getPageData(pages, index) {
  if (!pages || index < 0 || index >= pages.length) return null;
  return { num: index, year: pages[index].year, title: pages[index].title };
}

function Label({ refEl, data, align, onClick }) {
  if (!data) return null;
  return (
    <div
      ref={refEl}
      onClick={onClick}
      className={`opacity-0 pointer-events-auto leading-[1.1] cursor-pointer ${align === "right" ? "text-right" : "text-left"} hover:text-black/50 transition-colors duration-300`}
    >
      <p className="text-[1.2rem] font-medium uppercase m-0">
        Year {data?.num ?? ""}
      </p>
      <p className="text-[2.4rem] font-bold mt-[0.6rem] mb-[0.4rem] mx-0">
        {data?.year ?? ""}
      </p>
      <p className="text-[1.2rem] font-medium uppercase m-0">
        {data?.title ?? ""}
      </p>
    </div>
  );
}

export default function BookLabels() {
  const pages = useStore((s) => s.pages);
  const bookCurrentPage = useStore((s) => s.bookCurrentPage);
  const active = useStore((s) => s.active);
  const selectedPage = useStore((s) => s.selectedPage);
  const setSelectedPage = useStore((s) => s.setSelectedPage);

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const prevPageRef = useRef(false);

  const totalSheets = pages ? Math.ceil((pages.length + 2) / 2) : 0;
  const isOpen =
    bookCurrentPage !== false &&
    bookCurrentPage > 0 &&
    bookCurrentPage < totalSheets &&
    active &&
    selectedPage === false;

  const leftData = useMemo(
    () => getPageData(pages, 2 * (bookCurrentPage - 1)),
    [pages, bookCurrentPage],
  );
  const rightData = useMemo(
    () => getPageData(pages, 2 * bookCurrentPage - 1),
    [pages, bookCurrentPage],
  );

  // In/Out
  useEffect(() => {
    if (!leftRef.current || !rightRef.current) return;

    if (isOpen) {
      prevPageRef.current = bookCurrentPage;
      gsap.killTweensOf([leftRef.current, rightRef.current]);
      gsap.fromTo(
        leftRef.current,
        { x: -24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.5 },
      );
      gsap.fromTo(
        rightRef.current,
        { x: 24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.5 },
      );
    } else if (!isOpen) {
      gsap.killTweensOf([leftRef.current, rightRef.current]);
      gsap.to(leftRef.current, {
        x: -24,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      });
      gsap.to(rightRef.current, {
        x: 24,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      });
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Change pages
  const pageTl = useRef(null);
  useEffect(() => {
    if (
      !isOpen ||
      bookCurrentPage === false ||
      bookCurrentPage === prevPageRef.current
    )
      return;
    prevPageRef.current = bookCurrentPage;
    pageTl.current?.kill();
    pageTl.current = gsap.timeline();
    pageTl.current
      .to(leftRef.current, {
        x: -20,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
      })
      .to(
        rightRef.current,
        { x: 20, opacity: 0, duration: 0.25, ease: "power2.in" },
        "<",
      )
      .fromTo(
        leftRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.55, ease: "power3.out" },
      )
      .fromTo(
        rightRef.current,
        { x: 20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.55, ease: "power3.out" },
        "<",
      );
  }, [bookCurrentPage, isOpen]);

  return (
    <>
      <div className="fixed left-0 top-0 h-full w-[14rem] flex items-center pl-[2.4rem] pointer-events-none z-10">
        <Label
          refEl={leftRef}
          data={leftData}
          align="left"
          onClick={() => isOpen && setSelectedPage(bookCurrentPage - 1)}
        />
      </div>

      <div className="fixed right-0 top-0 h-full w-[14rem] flex items-center justify-end pr-[2.4rem] pointer-events-none z-10">
        <Label
          refEl={rightRef}
          data={rightData}
          align="right"
          onClick={() => isOpen && setSelectedPage(bookCurrentPage)}
        />
      </div>
    </>
  );
}

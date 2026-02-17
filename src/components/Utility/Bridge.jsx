import { useEffect } from "react";
import { useStore } from "@/store/useStore";

export default function Bridge({ year = false, years = false }) {
  const setYearData = useStore((state) => state.setYearData);
  const setPages = useStore((state) => state.setPages);
  const pages = useStore((state) => state.pages);
  useEffect(() => {
    if (!year?.acf?.vignette) return;

    const sync = () => {
      const page = [year.acf.completo, year.acf.completo_texture];
      setYearData(year.slug, year.acf.vignette, page);
    };

    const currentTransition = useStore.getState().transition;
    if (!currentTransition) {
      sync();
      return;
    }

    const unsubscribe = useStore.subscribe((state) => {
      if (!state.transition) {
        unsubscribe();
        sync();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [year]);

  useEffect(() => {
    if (years && pages.length === 0) {
      setPages(years);
    }
  }, [years]);

  return null;
}

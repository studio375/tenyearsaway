import { useEffect } from "react";
import { useStore } from "@/store/useStore";

export default function Bridge({ year = false, years = false, page = false }) {
  const setYearData = useStore((state) => state.setYearData);
  const setPages = useStore((state) => state.setPages);
  const pages = useStore((state) => state.pages);
  const setTeam = useStore((state) => state.setTeam);
  useEffect(() => {
    if (!year?.acf?.vignette) return;

    const sync = () => {
      const page = [
        year.acf.completo,
        year.acf.completo_texture,
        year.acf?.titolo || year.title?.rendered,
      ];
      setYearData(year.slug, year.acf.vignette, page);

      // Prefetch KTX2 textures into HTTP cache as soon as year data syncs
      year.acf.vignette.forEach((frame) => {
        if (!frame.texture?.url) return;
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = frame.texture.url;
        document.head.appendChild(link);
      });
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

  useEffect(() => {
    if (!page?.acf?.team) return;
    const team = page.acf.team.map((item) => ({
      name: item.nome,
      card: item.card,
      desc: item.descrizione,
    }));
    setTeam(team);
  }, [page]);

  return null;
}

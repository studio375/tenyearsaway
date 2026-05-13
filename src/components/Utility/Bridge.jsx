import { useEffect } from "react";
import { useStore } from "@/store/useStore";

// Fetch a single KTX2 file with retry on 503
async function fetchWithRetry(url, signal, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    if (signal?.aborted) return;
    try {
      const res = await fetch(url, { signal });
      if (res.ok || res.status !== 503) return;
    } catch {
      if (signal?.aborted) return;
      if (i === maxRetries - 1) return;
    }
    // Wait before retry: 2s, 4s, 6s
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
}

// Download all KTX2 files, max 2 concurrent, populates HTTP cache
async function warmKTX2Cache(urls, signal) {
  const queue = [...urls];
  const worker = async () => {
    while (queue.length > 0) {
      if (signal?.aborted) return;
      const url = queue.shift();
      if (url) await fetchWithRetry(url, signal);
    }
  };
  await Promise.all([worker(), worker()]);
}

export default function Bridge({ year = false, years = false, page = false }) {
  const setYearData = useStore((state) => state.setYearData);
  const setPages = useStore((state) => state.setPages);
  const pages = useStore((state) => state.pages);
  const setTeam = useStore((state) => state.setTeam);
  useEffect(() => {
    if (!year?.acf?.vignette) return;

    const controller = new AbortController();

    const sync = async () => {
      // Download all KTX2 files (2 at a time, retry on 503) before handing
      // frames to the store — useKTX2 will then get instant cache hits
      const urls = year.acf.vignette
        .map((f) => f.texture?.url)
        .filter(Boolean);
      if (urls.length > 0) {
        await warmKTX2Cache(urls, controller.signal);
      }
      if (controller.signal.aborted) return;

      const page = [
        year.acf.completo,
        year.acf.completo_texture,
        year.acf?.titolo || year.title?.rendered,
      ];
      setYearData(year.slug, year.acf.vignette, page);
    };

    let unsubscribe = null;
    const currentTransition = useStore.getState().transition;
    if (!currentTransition) {
      sync();
    } else {
      unsubscribe = useStore.subscribe((state) => {
        if (!state.transition) {
          unsubscribe?.();
          unsubscribe = null;
          sync();
        }
      });
    }

    return () => {
      controller.abort();
      unsubscribe?.();
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

import { fetchAPI } from "@/helpers/api/fetch-api";

export default async function handler(req, res) {
  const locale = req.query.locale ?? "it";

  try {
    const data = await fetchAPI("anno", {
      _fields: "slug,acf.completo,acf.completo_texture,acf.titolo",
      acf_format: "standard",
      order: "asc",
      per_page: 100,
      lang: locale,
    });

    const years = (data ?? []).map((item) => ({
      year: item.slug,
      title: item.acf?.titolo || null,
      full: item.acf?.completo || null,
      fullTexture: item.acf?.completo_texture || null,
    }));

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(years);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

import { fetchAPI } from "@/helpers/api/fetch-api";

export default async function handler(req, res) {
  const locale = req.query.locale ?? "it";

  try {
    const page = await fetchAPI("pages", {
      slug: "about",
      _fields: "acf.team",
      acf_format: "standard",
      lang: locale,
    });

    if (!page?.acf?.team?.length) {
      return res.status(200).json([]);
    }

    const team = page.acf.team.map((item) => ({
      name: item.nome,
      card: item.card,
      desc: item.descrizione,
    }));

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(team);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

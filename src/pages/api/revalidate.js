import { revalidateTag } from "next/cache";

const LOCALES = ["it", "en"];

export default async function handler(req, res) {
  try {
    revalidateTag("all");

    const slugsRes = await fetch(
      "https://admin10.375.studio/wp-json/wp/v2/anno?per_page=100&_fields=slug",
      { cache: "no-store" }
    );
    const years = await slugsRes.json();

    const paths = [];
    for (const locale of LOCALES) {
      paths.push(`/${locale}`);
      paths.push(`/${locale}/year`);
      paths.push(`/${locale}/about`);
      for (const year of years) {
        paths.push(`/${locale}/year/${year.slug}`);
      }
    }

    const results = await Promise.allSettled(paths.map((p) => res.revalidate(p)));
    const failed = results
      .map((r, i) => r.status === "rejected" ? { path: paths[i], reason: r.reason?.message } : null)
      .filter(Boolean);

    return res.status(200).json({ revalidated: true, count: years.length, failed });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

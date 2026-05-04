import { fetchAPI } from "@/helpers/api/fetch-api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://tenyearsaway.375.studio";

// localePrefix: "as-needed" → default locale (it) has no prefix
function url(locale, path = "") {
  const prefix = locale === "it" ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}${path}`;
}

function buildAlternates(locales, path) {
  return locales
    .map(
      (l) =>
        `<xhtml:link rel="alternate" hreflang="${l}" href="${url(l, path)}"/>`,
    )
    .join("\n      ");
}

function buildUrl(locales, locale, path, changefreq, priority) {
  return `
  <url>
    <loc>${url(locale, path)}</loc>
    ${buildAlternates(locales, path)}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function generateSitemap(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
  ${entries.join("\n  ")}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  const locales = ["it", "en"];
  const years = await fetchAPI("anno", { _fields: "slug", per_page: 100 });
  const yearSlugs = (years || []).map((y) => y.slug);

  const staticPaths = [
    { path: "", changefreq: "monthly", priority: "1.0" },
    { path: "/year", changefreq: "monthly", priority: "0.8" },
    { path: "/about", changefreq: "yearly", priority: "0.5" },
  ];

  const entries = [];

  for (const { path, changefreq, priority } of staticPaths) {
    entries.push(buildUrl(locales, "it", path, changefreq, priority));
  }

  for (const slug of yearSlugs) {
    entries.push(buildUrl(locales, "it", `/year/${slug}`, "monthly", "0.9"));
  }

  const sitemap = generateSitemap(entries);

  res.setHeader("Content-Type", "text/xml");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=86400, stale-while-revalidate=3600",
  );
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  return null;
}

import Head from "next/head";
import { fetchAPI } from "@/helpers/api/fetch-api";
import Bridge from "@/components/Utility/Bridge";
import End from "@/components/Library/End";
import { routing } from "@/i18n/routing";

export async function getStaticPaths() {
  const years = await fetchAPI("anno", { _fields: "slug", per_page: 100 });
  const paths = routing.locales.flatMap((locale) =>
    years.map((year) => ({
      params: { locale, slug: year.slug },
    }))
  );

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const { locale, slug } = params;
  const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
  const year = await fetchAPI("anno", {
    slug,
    acf_format: "standard",
    per_page: 100,
    lang: locale,
  });

  if (!year) return { notFound: true };

  return {
    props: { year, messages, locale },
    revalidate: 3600,
  };
}

const yearLabel = { it: "Anno", en: "Year" };
const descTemplate = {
  it: (slug, title) =>
    `Anno ${slug} — ${title}. Scopri questo capitolo del fumetto interattivo Ten Years Away.`,
  en: (slug, title) =>
    `Year ${slug} — ${title}. Discover this chapter of the interactive graphic novel Ten Years Away.`,
};

export default function Year({ year, locale }) {
  const slug = year?.slug;
  const isLastYear = slug === "2025";
  const title = year?.acf?.titolo || year?.title?.rendered || slug;
  const label = yearLabel[locale] ?? "Year";
  const pageTitle = `${label} ${slug} - ${title} | Ten Years Away`;
  const mkDesc = descTemplate[locale] ?? descTemplate.en;
  const description = mkDesc(slug, title);

  return (
    <div>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
      </Head>
      <main
        className={`pointer-events-none relative z-10 ${isLastYear ? "h-[1300vh]" : "h-[1000vh]"}`}
      >
        <End />
        <Bridge year={year} />
      </main>
    </div>
  );
}

import Head from "next/head";
import { fetchAPI } from "@/helpers/api/fetch-api";
import Bridge from "@/components/Utility/Bridge";
import BookLabels from "@/components/Scene/Book/Labels";
import { routing } from "@/i18n/routing";

export async function getStaticPaths() {
  return {
    paths: routing.locales.map((locale) => ({ params: { locale } })),
    fallback: false,
  };
}

export async function getStaticProps({ params: { locale } }) {
  const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
  const data = await fetchAPI("anno", {
    _fields: "slug,title,acf.completo,acf.completo_texture,acf.titolo",
    acf_format: "standard",
    order: "asc",
    per_page: 100,
    lang: locale,
  });

  const cleanData = data.map((item) => ({
    year: item.slug,
    title: item.acf?.titolo || null,
    full: item.acf?.completo || null,
    fullTexture: item.acf?.completo_texture || null,
  }));

  return {
    props: { years: cleanData, messages, locale },
    revalidate: 3600,
  };
}

const SEO = {
  it: {
    title: "Tutti gli anni | Ten Years Away",
    description:
      "Esplora tutti gli anni di Ten Years Away, il fumetto interattivo di Studio375.",
  },
  en: {
    title: "All Years | Ten Years Away",
    description:
      "Explore all years of Ten Years Away, the interactive graphic novel by Studio375.",
  },
};

export default function Year({ years, locale }) {
  const seo = SEO[locale] ?? SEO.en;
  return (
    <div>
      <Head>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />
      </Head>
      <main className="pointer-events-none relative z-10 h-screen">
        <BookLabels />
        <Bridge years={years} />
      </main>
    </div>
  );
}

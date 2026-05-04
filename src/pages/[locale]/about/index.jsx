import Head from "next/head";
import { fetchAPI } from "@/helpers/api/fetch-api";
import Bridge from "@/components/Utility/Bridge";
import AboutText from "@/components/Library/AboutText";
import { routing } from "@/i18n/routing";

export async function getStaticPaths() {
  return {
    paths: routing.locales.map((locale) => ({ params: { locale } })),
    fallback: false,
  };
}

export async function getStaticProps({ params: { locale } }) {
  const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
  const page = await fetchAPI("pages", {
    slug: "about",
    _fields: "acf,slug",
    acf_format: "standard",
    lang: locale,
  });

  return {
    props: { page, messages, locale },
    revalidate: 3600,
  };
}

const SEO = {
  it: {
    title: "Chi siamo | Ten Years Away",
    description:
      "Studio375 è un'agenzia di comunicazione, grafica e web con sede a Vicenza. Scopri chi ha creato Ten Years Away.",
  },
  en: {
    title: "About | Ten Years Away",
    description:
      "Studio375 is a communication, graphic design and web agency based in Vicenza. Discover who created Ten Years Away.",
  },
};

export default function About({ page, locale }) {
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
        <Bridge page={page} />
        <AboutText />
      </main>
    </div>
  );
}

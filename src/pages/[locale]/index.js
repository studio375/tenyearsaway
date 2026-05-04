import { useLayoutEffect } from "react";
import Head from "next/head";
import { useStore } from "@/store/useStore";
import { routing } from "@/i18n/routing";

export async function getStaticPaths() {
  return {
    paths: routing.locales.map((locale) => ({ params: { locale } })),
    fallback: false,
  };
}

export async function getStaticProps({ params: { locale } }) {
  const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
  return {
    props: { messages, locale },
  };
}

const SEO = {
  it: {
    title: "Ten Years Away - Un fumetto, di una storia vera",
    description:
      "Un fumetto, di una storia vera, basata su noi. Un'esperienza interattiva firmata Studio375.",
  },
  en: {
    title: "Ten Years Away - A graphic novel, of a true story",
    description:
      "A graphic novel, of a true story, based on us. An interactive experience by Studio375.",
  },
};

export default function HomePage({ locale }) {
  const setTransition = useStore((state) => state.setTransition);
  const seo = SEO[locale] ?? SEO.en;

  useLayoutEffect(() => {
    const currentTransition = useStore.getState().transition;
    if (currentTransition !== "exit") {
      setTransition(false);
    }
  }, []);

  return (
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
  );
}

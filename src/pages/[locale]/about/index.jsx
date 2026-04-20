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

export default function About({ page }) {
  return (
    <div>
      <main className="pointer-events-none relative z-10 h-screen">
        <Bridge page={page} />
        <AboutText />
      </main>
    </div>
  );
}

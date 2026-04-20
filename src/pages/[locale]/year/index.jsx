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

export default function Year({ years }) {
  return (
    <div>
      <main className="pointer-events-none relative z-10 h-screen">
        <BookLabels />
        <Bridge years={years} />
      </main>
    </div>
  );
}

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

  return {
    props: { year, messages, locale },
    revalidate: 10,
  };
}

export default function Year({ year }) {
  const slug = year?.slug;
  const isLastYear = slug === "2025";
  return (
    <div>
      <main
        className={`pointer-events-none relative z-10 ${isLastYear ? "h-[1300vh]" : "h-[1000vh]"}`}
      >
        <End />
        <Bridge year={year} />
      </main>
    </div>
  );
}

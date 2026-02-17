import { fetchAPI } from "@/helpers/api/fetch-api";
import Bridge from "@/components/Utility/Bridge";

export async function getStaticProps() {
  const data = await fetchAPI("anno", {
    _fields: "slug,acf.completo,acf.completo_texture",
    acf_format: "standard",
    order: "asc",
    per_page: 100,
  });

  const cleanData = data.map((item) => ({
    year: item.slug,
    full: item.acf?.completo || null,
    fullTexture: item.acf?.completo_texture || null,
  }));

  return {
    props: { years: cleanData },
    revalidate: 10,
  };
}

export default function Year({ years }) {
  return (
    <div>
      <main className="pointer-events-none relative z-10 h-screen">
        <Bridge years={years} />
      </main>
    </div>
  );
}

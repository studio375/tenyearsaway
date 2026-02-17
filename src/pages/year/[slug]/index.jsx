import { fetchAPI } from "@/helpers/api/fetch-api";
import Bridge from "@/components/Utility/Bridge";

export async function getStaticPaths() {
  const years = await fetchAPI("anno", { _fields: "slug", per_page: 100 });
  const paths = years.map((year) => ({
    params: { slug: year.slug },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const year = await fetchAPI("anno", {
    slug: params.slug,
    acf_format: "standard",
    per_page: 100,
  });

  return {
    props: { year },
    revalidate: 10,
  };
}

export default function Year({ year }) {
  return (
    <div>
      <main className="pointer-events-none relative z-10 h-[1600vh]">
        <Bridge year={year} />
      </main>
    </div>
  );
}

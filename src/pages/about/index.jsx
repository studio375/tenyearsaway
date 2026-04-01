import { fetchAPI } from "@/helpers/api/fetch-api";
import Bridge from "@/components/Utility/Bridge";
import AboutText from "@/components/Library/AboutText";

export async function getStaticProps() {
  const page = await fetchAPI("pages", {
    slug: "about",
    acf_format: "standard",
  });

  return {
    props: { page: page },
    revalidate: 10,
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

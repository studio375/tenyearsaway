export default async function handler(req, res) {
  try {
    const slugsRes = await fetch(
      "https://admin10.375.studio/wp-json/wp/v2/anno?per_page=100&_fields=slug"
    );
    const years = await slugsRes.json();

    await res.revalidate("/");
    await Promise.all(
      years.map((year) => res.revalidate(`/year/${year.slug}`))
    );

    return res.status(200).json({ revalidated: true, count: years.length });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

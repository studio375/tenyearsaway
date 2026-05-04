export function getBackendURL(path = "") {
  if (typeof window === "undefined") {
    const base =
      process.env.BACKEND_ENDPOINT ?? "https://admin10.375.studio/wp-json/wp/v2";
    return `${base}${path}`;
  }
  return `https://admin10.375.studio${path}`;
}

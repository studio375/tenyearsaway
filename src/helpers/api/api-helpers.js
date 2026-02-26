export function getBackendURL(path = "") {
  let ret = `http://admin10.375.studio/${path}`;
  if (typeof window == "undefined") {
    ret = `${(process.env.BACKEND_ENDPOINT =
      "http://admin10.375.studio/wp-json/wp/v2")}${path}`;
  }

  return ret;
}

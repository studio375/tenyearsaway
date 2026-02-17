export function getBackendURL(path = "") {
  let ret = `http://tenyearsaway.local/${path}`;
  if (typeof window == "undefined") {
    ret = `${(process.env.BACKEND_ENDPOINT =
      "http://tenyearsaway.local/wp-json/wp/v2")}${path}`;
  }

  return ret;
}

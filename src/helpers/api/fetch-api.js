import { getBackendURL } from "./api-helpers";
import qs from "qs";

const FETCH_TIMEOUT_MS = 8000;

export async function fetchAPI(path = "", urlParamsObject = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const queryString = qs.stringify(urlParamsObject);
    const requestUrl = `${getBackendURL(
      `/${path}${queryString ? `?${queryString}` : ""}`,
    )}`;

    const response = await fetch(requestUrl, {
      next: { tags: ["all"] },
      cache: "force-cache",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const r = await response.json();
    if ("slug" in urlParamsObject) {
      return Array.isArray(r) ? (r[0] ?? null) : null;
    }
    return r;
  } catch (error) {
    clearTimeout(timeout);
    console.error(`fetchAPI error [${path}]:`, error);
    return null;
  }
}

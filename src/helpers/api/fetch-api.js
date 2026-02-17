import { getBackendURL } from "./api-helpers";
import qs from "qs";
export async function fetchAPI(path = "", urlParamsObject = {}) {
  try {
    const options = {
      next: { tags: ["all"] },
      cache: "force-cache",
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Build request URL
    const queryString = qs.stringify(urlParamsObject);
    const requestUrl = `${getBackendURL(
      `/${path}${queryString ? `?${queryString}` : ""}`,
    )}`;
    // Trigger API call
    const response = await fetch(requestUrl, options);
    const r = await response.json();
    if ("slug" in urlParamsObject) {
      return Array.isArray(r) ? (r[0] ?? null) : null;
    }
    return r;
  } catch (error) {
    console.error(error);
    throw new Error(
      `Please check if your server is running and you set all the required tokens.`,
    );
  }
}

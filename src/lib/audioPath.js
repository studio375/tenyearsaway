const supportsOgg =
  typeof Audio !== "undefined" && new Audio().canPlayType("audio/ogg") !== "";

/**
 * Returns a single compressed path: OGG if browser supports it, else compressed MP3.
 * Use for fetch/prefetch where a single URL is needed.
 * @param {string} originalPath  e.g. "/audio/2015.mp3" or "/sound/whoosh.mp3"
 * @returns {string}
 */
export function resolveAudioPath(originalPath) {
  const compressed = originalPath
    .replace("/audio/", "/audio-compressed/")
    .replace("/sound/", "/sound-compressed/");
  return supportsOgg ? compressed.replace(/\.mp3$/, ".ogg") : compressed;
}

/**
 * Returns [ogg, mp3] array from compressed folders for Howler/useSound format fallback.
 * Howler tries formats in order and picks the first one the browser can play.
 * @param {string} originalPath  e.g. "/audio/2015.mp3" or "/sound/whoosh.mp3"
 * @returns {string[]}
 */
export function resolveAudioSrc(originalPath) {
  const base = originalPath
    .replace("/audio/", "/audio-compressed/")
    .replace("/sound/", "/sound-compressed/")
    .replace(/\.mp3$/, "");
  return [`${base}.ogg`, `${base}.mp3`];
}

import { getDriveImageEmbedProps } from "./galleryImageUtils";

const maxUrlByKey = new Map();
const previewUrlByKey = new Map();
const inflightMax = new Map();
const SESSION_KEY = "viewer_max_cache_v1";
const SESSION_MAX_ENTRIES = 200;

function readSessionStore() {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeSessionStore(store) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

function persistMaxUrl(cacheKey, url) {
  const store = readSessionStore();
  store[cacheKey] = url;
  const keys = Object.keys(store);
  if (keys.length > SESSION_MAX_ENTRIES) {
    keys.slice(0, keys.length - SESSION_MAX_ENTRIES).forEach((k) => delete store[k]);
  }
  writeSessionStore(store);
}

export function getCachedMaxUrl(cacheKey) {
  if (!cacheKey) return null;
  if (maxUrlByKey.has(cacheKey)) return maxUrlByKey.get(cacheKey);
  const fromSession = readSessionStore()[cacheKey];
  if (fromSession) {
    maxUrlByKey.set(cacheKey, fromSession);
    return fromSession;
  }
  return null;
}

export function getCachedPreviewUrl(cacheKey) {
  return cacheKey ? previewUrlByKey.get(cacheKey) || null : null;
}

export function setCachedPreviewUrl(cacheKey, url) {
  if (cacheKey && url) previewUrlByKey.set(cacheKey, url);
}

export function setCachedMaxUrl(cacheKey, url) {
  if (!cacheKey || !url) return;
  maxUrlByKey.set(cacheKey, url);
  persistMaxUrl(cacheKey, url);
}

export function preloadFirstWorkingUrl(candidates, { referrerPolicy } = {}) {
  const urls = [...new Set(candidates.filter(Boolean))];
  return new Promise((resolve, reject) => {
    let index = 0;
    const tryNext = () => {
      if (index >= urls.length) {
        reject(new Error("All image URLs failed"));
        return;
      }
      const url = urls[index++];
      const img = new Image();
      if (referrerPolicy) img.referrerPolicy = referrerPolicy;
      img.onload = () => resolve(url);
      img.onerror = tryNext;
      img.src = url;
    };
    tryNext();
  });
}

export function preloadMaxQuality(image, cacheKey, candidates) {
  const cached = getCachedMaxUrl(cacheKey);
  if (cached) return Promise.resolve(cached);

  if (inflightMax.has(cacheKey)) return inflightMax.get(cacheKey);

  const embed = getDriveImageEmbedProps(image);
  const promise = preloadFirstWorkingUrl(candidates, embed)
    .then((url) => {
      setCachedMaxUrl(cacheKey, url);
      inflightMax.delete(cacheKey);
      return url;
    })
    .catch((err) => {
      inflightMax.delete(cacheKey);
      throw err;
    });

  inflightMax.set(cacheKey, promise);
  return promise;
}

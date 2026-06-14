/**
 * Event Highlights — shared uploads.
 * Set VITE_EVENT_HIGHLIGHTS_URL to your Google Apps Script Web App URL (see event-highlights-apps-script.js).
 * If unset, uploads are stored only in this browser (localStorage); not visible to others.
 */

const LS_KEY = "event_highlights_local_v1";
const LIST_CACHE_KEY = "event_highlights_list_v2";
const LIST_CACHE_TTL_MS = 5 * 60 * 1000;
const NOTE_MAX = 90;
const API_URL = (import.meta.env.VITE_EVENT_HIGHLIGHTS_URL || "").trim();

/** @typedef {{ createdAt: string; note: string; fileId: string; mimeType: string; thumbFileId?: string; durationSec?: number; _dataUrl?: string; _thumbDataUrl?: string }} HighlightItem */

export function getNoteMax() {
  return NOTE_MAX;
}

export function isSharedBackendConfigured() {
  return Boolean(API_URL);
}

function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

function writeLocal(items) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

function normalizeHighlights(items) {
  /** @type {Map<string, HighlightItem>} */
  const byId = new Map();
  for (const raw of items) {
    const fileId = String(raw?.fileId || "").trim();
    if (!fileId) continue;
    const durationSec = Number(raw.durationSec);
    byId.set(fileId, {
      createdAt: String(raw.createdAt || ""),
      note: String(raw.note || ""),
      fileId,
      mimeType: String(raw.mimeType || ""),
      ...(raw.thumbFileId ? { thumbFileId: String(raw.thumbFileId) } : {}),
      ...(Number.isFinite(durationSec) && durationSec > 0 ? { durationSec } : {}),
      ...(raw._dataUrl ? { _dataUrl: raw._dataUrl } : {}),
      ...(raw._thumbDataUrl ? { _thumbDataUrl: raw._thumbDataUrl } : {}),
    });
  }
  return [...byId.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function readListCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LIST_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return null;
    if (Date.now() - Number(parsed.ts || 0) > LIST_CACHE_TTL_MS) return null;
    return normalizeHighlights(parsed.items);
  } catch {
    return null;
  }
}

function writeListCache(items) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      LIST_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), items })
    );
  } catch {
    /* quota / private mode */
  }
}

/** Stale list for instant grid paint (session cache, ~5 min). */
export function peekHighlightsCache() {
  if (API_URL) return readListCache();
  return normalizeHighlights(readLocal());
}

/**
 * @returns {Promise<HighlightItem[]>}
 */
export async function fetchHighlights() {
  if (API_URL) {
    const sep = API_URL.includes("?") ? "&" : "?";
    const res = await fetch(`${API_URL}${sep}action=list`, { method: "GET" });
    const json = await res.json().catch(() => ({}));
    if (!json.success) throw new Error(json.message || "Failed to load highlights");
    const items = Array.isArray(json.items) ? json.items : [];
    const normalized = normalizeHighlights(items);
    writeListCache(normalized);
    return normalized;
  }
  return normalizeHighlights(readLocal());
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

/**
 * POST to Apps Script Web App. Must stay a "simple" cross-origin request (no custom
 * headers) — otherwise the browser sends a CORS preflight that Google does not answer.
 * Upload % is estimated (fetch cannot report byte progress to Apps Script).
 * @param {string} url
 * @param {string} body
 * @param {(p: { phase: string; percent: number; label: string }) => void} [onProgress]
 */
async function fetchPostJson(url, body, onProgress) {
  const started = Date.now();
  const bytes = body.length;
  const estMs = Math.min(120000, Math.max(8000, bytes / 40));

  const tick = setInterval(() => {
    const elapsed = Date.now() - started;
    const ratio = Math.min(0.92, elapsed / estMs);
    const percent = 50 + Math.round(ratio * 45);
    onProgress?.({
      phase: "upload",
      percent,
      label: "Uploading…",
    });
  }, 350);

  onProgress?.({ phase: "upload", percent: 52, label: "Uploading…" });

  try {
    const res = await fetch(url, {
      method: "POST",
      redirect: "follow",
      body,
    });
    const text = await res.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("Upload failed — invalid response");
    }
    if (!res.ok || !json.success) {
      throw new Error(json.message || `Upload failed (${res.status})`);
    }
    onProgress?.({ phase: "upload", percent: 100, label: "Done" });
    return json;
  } catch (err) {
    if (err instanceof TypeError && /fetch|network/i.test(String(err.message))) {
      throw new Error("Network error during upload. Check connection and try again.");
    }
    throw err;
  } finally {
    clearInterval(tick);
  }
}

/**
 * @param {File} file
 * @param {string} note
 * @param {{ thumbFile?: File | null; durationSec?: number; onProgress?: (p: { phase?: string; percent: number; label: string }) => void }} [opts]
 * @returns {Promise<HighlightItem>}
 */
export async function uploadHighlight(file, note, opts = {}) {
  const { thumbFile = null, durationSec = 0, onProgress } = opts;
  const trimmed = String(note || "")
    .trim()
    .slice(0, NOTE_MAX);

  if (API_URL) {
    onProgress?.({ phase: "upload", percent: 52, label: "Encoding for upload…" });
    const dataBase64 = await fileToBase64(file);
    let thumbDataBase64 = "";
    let thumbMimeType = "";
    if (thumbFile) {
      thumbDataBase64 = await fileToBase64(thumbFile);
      thumbMimeType = thumbFile.type || "image/jpeg";
    }

    const body = JSON.stringify({
      action: "add",
      mimeType: file.type || "application/octet-stream",
      dataBase64,
      note: trimmed,
      ...(thumbDataBase64 ? { thumbDataBase64, thumbMimeType } : {}),
      ...(durationSec > 0 ? { durationSec } : {}),
    });

    const json = await fetchPostJson(API_URL, body, onProgress);
    return json.item;
  }

  const maxBytes = file.type.startsWith("video/") ? 1.5 * 1024 * 1024 : 2 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(
      file.type.startsWith("video/")
        ? "Video is too large for demo mode. Set VITE_EVENT_HIGHLIGHTS_URL for full uploads."
        : "Image is too large for demo mode (max ~2 MB). Set VITE_EVENT_HIGHLIGHTS_URL for larger files."
    );
  }

  onProgress?.({ phase: "upload", percent: 70, label: "Saving locally…" });
  const dataUrl = await fileToDataUrl(file);
  let thumbDataUrl = "";
  if (thumbFile) {
    thumbDataUrl = await fileToDataUrl(thumbFile);
  }
  const item = {
    fileId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    note: trimmed,
    mimeType: file.type || "application/octet-stream",
    _dataUrl: dataUrl,
    ...(thumbDataUrl ? { _thumbDataUrl: thumbDataUrl } : {}),
    ...(durationSec > 0 ? { durationSec } : {}),
  };
  const next = [...readLocal(), item];
  writeLocal(next);
  onProgress?.({ phase: "upload", percent: 100, label: "Done" });
  return item;
}

export function driveImageThumbUrl(fileId, width = 400) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${width}`;
}

/** Full-size-ish view for lightbox (still resized by Drive, not raw upload). */
export function driveImageViewerUrl(fileId) {
  return driveImageThumbUrl(fileId, 1200);
}

/** @deprecated Prefer driveImageThumbUrl / driveImageViewerUrl */
export function driveImageUrl(fileId) {
  return driveImageThumbUrl(fileId);
}

export function driveVideoPreviewUrl(fileId) {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
}

/** Direct stream URL for native <video> (public Drive files). */
export function driveVideoStreamUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
}

/** Alternate stream when primary is blocked. */
export function driveVideoStreamFallbackUrl(fileId) {
  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;
}

/** Third stream candidate (docs host). */
export function driveVideoStreamAltUrl(fileId) {
  return `https://docs.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
}

/** Stream via Apps Script — resolves public Drive URLs (JSON, not binary). */
export function highlightVideoStreamResolveUrl(fileId) {
  if (!API_URL || !fileId) return "";
  const sep = API_URL.includes("?") ? "&" : "?";
  return `${API_URL}${sep}action=stream&fileId=${encodeURIComponent(fileId)}`;
}

/** Ordered native <video> src candidates (Drive direct links). */
export function getHighlightVideoStreamCandidates(fileId, { preferViewFirst = false } = {}) {
  const id = encodeURIComponent(fileId);
  const downloadFirst = [
    driveVideoStreamUrl(fileId),
    driveVideoStreamFallbackUrl(fileId),
    driveVideoStreamAltUrl(fileId),
    `https://drive.google.com/uc?export=download&confirm=t&id=${id}`,
  ];
  const viewFirst = [
    driveVideoStreamFallbackUrl(fileId),
    driveVideoStreamUrl(fileId),
    driveVideoStreamAltUrl(fileId),
    `https://drive.google.com/uc?export=download&confirm=t&id=${id}`,
  ];
  return preferViewFirst ? viewFirst : downloadFirst;
}

/** Fetch stream URLs from API (verifies file exists) then merge with Drive fallbacks. */
export async function resolveHighlightVideoSources(fileId, { preferViewFirst = false } = {}) {
  const fallbacks = getHighlightVideoStreamCandidates(fileId, { preferViewFirst });
  const resolveUrl = highlightVideoStreamResolveUrl(fileId);
  if (!resolveUrl) return fallbacks;

  try {
    const res = await fetch(resolveUrl, { method: "GET" });
    const json = await res.json().catch(() => ({}));
    if (!json.success) return fallbacks;
    const fromApi = uniqueStrings([
      json.url,
      json.viewUrl,
      preferViewFirst ? json.viewUrl : json.url,
    ]);
    return uniqueStrings([...fromApi, ...fallbacks]);
  } catch {
    return fallbacks;
  }
}

function uniqueStrings(list) {
  const out = [];
  const seen = new Set();
  for (const raw of list) {
    const s = String(raw || "").trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/** @deprecated Use highlightVideoStreamResolveUrl */
export function highlightVideoStreamUrl(fileId) {
  return highlightVideoStreamResolveUrl(fileId);
}

/** Whether this browser can play the uploaded mime in a native <video> tag. */
export function canPlayHighlightVideoNative(mimeType) {
  const mime = String(mimeType || "").toLowerCase();
  if (!mime.startsWith("video/")) return true;
  if (typeof document === "undefined") return true;
  const probe = document.createElement("video");
  if (mime.includes("webm")) {
    return (
      probe.canPlayType('video/webm; codecs="vp9"') !== "" ||
      probe.canPlayType('video/webm; codecs="vp8"') !== "" ||
      probe.canPlayType("video/webm") !== ""
    );
  }
  if (mime.includes("quicktime") || mime.includes("3gpp")) {
    return probe.canPlayType("video/mp4") !== "" || probe.canPlayType("video/quicktime") !== "";
  }
  return probe.canPlayType(mime.split(";")[0]) !== "" || probe.canPlayType("video/mp4") !== "";
}

/** Poster / gallery thumb for a video highlight. */
export function highlightVideoPosterUrl(item, width = 480) {
  if (item._thumbDataUrl) return item._thumbDataUrl;
  if (item.thumbFileId) return driveImageThumbUrl(item.thumbFileId, width);
  return "";
}

/**
 * @param {string} fileId
 * @returns {Promise<void>}
 */
export async function deleteHighlight(fileId) {
  const id = String(fileId || "").trim();
  if (!id) throw new Error("Missing file id");

  if (API_URL) {
    const res = await fetch(API_URL, {
      method: "POST",
      redirect: "follow",
      body: JSON.stringify({ action: "delete", fileId: id }),
    });
    const json = await res.json().catch(() => ({}));
    if (!json.success) throw new Error(json.message || "Delete failed");
    return;
  }

  const next = readLocal().filter((x) => x.fileId !== id);
  writeLocal(next);
}

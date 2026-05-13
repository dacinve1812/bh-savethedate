/**
 * Event Highlights — shared uploads.
 * Set VITE_EVENT_HIGHLIGHTS_URL to your Google Apps Script Web App URL (see event-highlights-apps-script.js).
 * If unset, uploads are stored only in this browser (localStorage); not visible to others.
 */

const LS_KEY = "event_highlights_local_v1";
const NOTE_MAX = 90;
const API_URL = (import.meta.env.VITE_EVENT_HIGHLIGHTS_URL || "").trim();

/** @typedef {{ createdAt: string; note: string; fileId: string; mimeType: string; _dataUrl?: string }} HighlightItem */

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
    return items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  const items = readLocal();
  return items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
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

/**
 * @param {File} file
 * @param {string} note
 * @returns {Promise<HighlightItem>}
 */
export async function uploadHighlight(file, note) {
  const trimmed = String(note || "")
    .trim()
    .slice(0, NOTE_MAX);

  if (API_URL) {
    const dataBase64 = await fileToBase64(file);
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "add",
        mimeType: file.type || "application/octet-stream",
        dataBase64,
        note: trimmed,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!json.success) throw new Error(json.message || "Upload failed");
    return json.item;
  }

  // Local-only demo: keep total payload small (localStorage quota ~5MB typical)
  const maxBytes = file.type.startsWith("video/") ? 1.5 * 1024 * 1024 : 2 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(
      file.type.startsWith("video/")
        ? "Video is too large for demo mode. Set VITE_EVENT_HIGHLIGHTS_URL for full uploads."
        : "Image is too large for demo mode (max ~2 MB). Set VITE_EVENT_HIGHLIGHTS_URL for larger files."
    );
  }
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
  const item = {
    fileId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    note: trimmed,
    mimeType: file.type || "application/octet-stream",
    _dataUrl: dataUrl,
  };
  const next = [...readLocal(), item];
  writeLocal(next);
  return item;
}

export function driveImageUrl(fileId) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1200`;
}

export function driveVideoPreviewUrl(fileId) {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
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
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "delete", fileId: id }),
    });
    const json = await res.json().catch(() => ({}));
    if (!json.success) throw new Error(json.message || "Delete failed");
    return;
  }

  const next = readLocal().filter((x) => x.fileId !== id);
  writeLocal(next);
}

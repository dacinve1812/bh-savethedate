/**
 * Seating — shared sync via Google Apps Script (see seating-apps-script.js).
 * Set VITE_SEATING_URL to the Web App URL. If unset, data stays in localStorage only.
 */

import { getDefaultSeating, loadSeating, saveSeating, mergeSeatingTables } from "./seatingData";

const API_URL = (import.meta.env.VITE_SEATING_URL || "").trim();
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "admin";

export function isSeatingSyncConfigured() {
  return Boolean(API_URL);
}

/**
 * @param {unknown} tables
 * @returns {import("./seatingData").SeatingData}
 */
export function seatingFromRemoteTables(tables) {
  const base = getDefaultSeating();
  if (!tables || typeof tables !== "object") return base;
  return mergeSeatingTables(base, /** @type {Record<string, unknown>} */ (tables));
}

/**
 * @returns {Promise<import("./seatingData").SeatingData>}
 */
export async function fetchSeatingRemote() {
  if (!API_URL) return loadSeating();

  const sep = API_URL.includes("?") ? "&" : "?";
  const res = await fetch(`${API_URL}${sep}action=get`, { method: "GET" });
  const json = await res.json().catch(() => ({}));
  if (!json.success) throw new Error(json.message || "Failed to load seating");

  const data = seatingFromRemoteTables(json.tables);
  saveSeating(data);
  return data;
}

/**
 * @param {import("./seatingData").SeatingData} data
 * @returns {Promise<import("./seatingData").SeatingData>}
 */
export async function saveSeatingRemote(data) {
  saveSeating(data);

  if (!API_URL) return data;

  const res = await fetch(API_URL, {
    method: "POST",
    redirect: "follow",
    body: JSON.stringify({
      action: "save",
      password: ADMIN_PASSWORD,
      tables: data.tables,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.success) throw new Error(json.message || "Failed to save seating");

  const synced = seatingFromRemoteTables(json.tables ?? data.tables);
  saveSeating(synced);
  return synced;
}

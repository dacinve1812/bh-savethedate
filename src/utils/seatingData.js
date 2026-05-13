import defaultSeating from "../seating.json";

const STORAGE_KEY = "seating_assignments";

/** @typedef {{ tables: Record<string, string[]> }} SeatingData */

export function normalizeName(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Lowercase, collapse spaces, strip accents — for matching "Truc" to "Thanh Trúc". */
export function foldForSearch(s) {
  try {
    return String(s ?? "")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return normalizeName(s);
  }
}

/** Numeric-aware sort: 2 before 10; non-numeric keys last, locale order. */
export function sortTableKeys(keys) {
  return [...keys].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    const aNum = Number.isFinite(na) && String(na) === a;
    const bNum = Number.isFinite(nb) && String(nb) === b;
    if (aNum && bNum) return na - nb;
    if (aNum && !bNum) return -1;
    if (!aNum && bNum) return 1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });
}

/** @returns {SeatingData} */
export function getDefaultSeating() {
  const t = defaultSeating.tables || {};
  const tables = {};
  for (const k of Object.keys(t)) {
    tables[k] = Array.isArray(t[k]) ? [...t[k]] : [];
  }
  return { tables };
}

/** @returns {SeatingData} */
export function loadSeating() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const base = getDefaultSeating();
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.tables !== "object") return base;
    const merged = { tables: { ...base.tables } };
    for (const k of Object.keys(parsed.tables)) {
      const arr = parsed.tables[k];
      if (Array.isArray(arr)) {
        merged.tables[k] = arr.map((x) => String(x).trim()).filter(Boolean);
      }
    }
    return merged;
  } catch {
    return getDefaultSeating();
  }
}

/** @param {SeatingData} data */
export function saveSeating(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("seating_updated"));
}

/**
 * @param {string} query
 * @param {SeatingData} data
 * @returns {{ guest: string; table: string }[]}
 */
export function findSeatsForQuery(query, data) {
  const fq = foldForSearch(query);
  if (!fq) return [];

  /** @type {{ guest: string; table: string }[]} */
  const exact = [];
  /** @type {{ guest: string; table: string }[]} */
  const partial = [];

  for (const table of sortTableKeys(Object.keys(data.tables))) {
    for (const guest of data.tables[table]) {
      const fg = foldForSearch(guest);
      if (!fg) continue;
      if (fg === fq) {
        exact.push({ guest, table });
      } else if (fq.length >= 2 && (fg.includes(fq) || fq.includes(fg))) {
        partial.push({ guest, table });
      }
    }
  }

  if (exact.length > 0) return exact;
  return partial;
}

/**
 * Live name hints while typing (accent-insensitive substring match).
 * @param {string} query
 * @param {SeatingData} data
 * @param {number} [limit]
 * @returns {{ guest: string; table: string }[]}
 */
export function getGuestRecommendations(query, data, limit = 8) {
  const fq = foldForSearch(query);
  if (fq.length < 2) return [];

  /** @type {Map<string, { guest: string; table: string }>} */
  const byGuest = new Map();

  for (const table of sortTableKeys(Object.keys(data.tables))) {
    for (const guest of data.tables[table]) {
      const fg = foldForSearch(guest);
      if (!fg || !fg.includes(fq)) continue;
      const key = `${guest}\0${table}`;
      if (!byGuest.has(key)) byGuest.set(key, { guest, table });
    }
  }

  const list = [...byGuest.values()];
  list.sort((a, b) => {
    const fa = foldForSearch(a.guest);
    const fb = foldForSearch(b.guest);
    const aStarts = fa.startsWith(fq) ? 0 : 1;
    const bStarts = fb.startsWith(fq) ? 0 : 1;
    if (aStarts !== bStarts) return aStarts - bStarts;
    return a.guest.localeCompare(b.guest, undefined, { sensitivity: "base" });
  });

  return list.slice(0, limit);
}

/**
 * Next table label: max numeric table + 1, or "1" if none.
 * @param {SeatingData} data
 */
export function suggestNextTableNumber(data) {
  let max = 0;
  for (const k of Object.keys(data.tables)) {
    const n = parseInt(k, 10);
    if (Number.isFinite(n) && String(n) === k && n > max) max = n;
  }
  return String(max + 1 || 1);
}

/**
 * Export long CSV: table,guest (one row per guest)
 * @param {SeatingData} data
 */
export function seatingToCsvLong(data) {
  const lines = ["table,guest"];
  for (const table of sortTableKeys(Object.keys(data.tables))) {
    for (const guest of data.tables[table]) {
      const safe = String(guest).replace(/"/g, '""');
      lines.push(`${table},"${safe}"`);
    }
  }
  return lines.join("\n");
}

/**
 * Parse CSV: supports
 * - table,guest (one row per guest)
 * - table,guests where guests are separated by ; or |
 * Any positive integer table id is allowed; new tables are created as needed.
 * @param {string} csvText
 * @returns {SeatingData}
 */
export function parseSeatingCsv(csvText) {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return getDefaultSeating();

  const data = getDefaultSeating();
  for (const k of Object.keys(data.tables)) {
    data.tables[k] = [];
  }

  let start = 0;
  const first = lines[0].toLowerCase();
  if (first.includes("table") && (first.includes("guest") || first.includes("name"))) {
    start = 1;
  }

  const ensureTable = (key) => {
    if (!data.tables[key]) data.tables[key] = [];
  };

  for (let i = start; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 2) continue;
    const rawTable = row[0].trim();
    const n = parseInt(rawTable, 10);
    if (!Number.isFinite(n) || n < 1) continue;
    const tableNum = String(n);
    ensureTable(tableNum);

    const rest = row.slice(1).join(",");
    if (rest.includes(";") || rest.includes("|")) {
      const parts = rest.split(/[;|]/).map((s) => s.trim().replace(/^"|"$/g, "").replace(/""/g, '"')).filter(Boolean);
      for (const p of parts) {
        data.tables[tableNum].push(p);
      }
    } else {
      const name = rest.replace(/^"|"$/g, "").replace(/""/g, '"').trim();
      if (name) data.tables[tableNum].push(name);
    }
  }

  for (const k of Object.keys(data.tables)) {
    data.tables[k] = [...new Set(data.tables[k].map((x) => x.trim()).filter(Boolean))];
  }

  return data;
}

/** Simple CSV line parser handling quoted fields */
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") {
        out.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
  }
  out.push(cur.trim());
  return out;
}

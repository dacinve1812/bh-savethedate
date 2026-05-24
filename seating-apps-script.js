/**
 * Google Apps Script — Seating assignments (shared read, password-protected write)
 *
 * SETUP:
 * 1. Create a Google Sheet (new tab or dedicated sheet). Copy SHEET_ID from the URL.
 * 2. Set SEATING_ADMIN_PASSWORD below (same value as VITE_ADMIN_PASSWORD in your site .env).
 * 3. Sheet tab "seating" stores rows: table | guest (one row per guest).
 * 4. Extensions → Apps Script → paste this file → Deploy → New deployment →
 *    Type: Web app → Execute as: Me → Who has access: Anyone
 * 5. Copy the Web App URL into your site .env as:
 *    VITE_SEATING_URL=https://script.google.com/macros/s/XXXX/exec
 * 6. Redeploy after edits (Manage deployments → New version).
 *
 * GET  ?action=get     → { success, tables: { "1": ["Name"], ... } }
 * POST { action:"save", password, tables } → overwrite sheet (admin only)
 */

const SEATING_SHEET_ID = "1sGhCtFZSZlgLuHIzrtcAnC9ewB6K_XV3kVlTC93v8tk";
const SEATING_SHEET_NAME = "seating";
/** Must match VITE_ADMIN_PASSWORD on the website. */
const SEATING_ADMIN_PASSWORD = "baobao";

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || "";
  if (action === "get") {
    try {
      const tables = readTablesFromSheet_();
      return jsonOut_({ success: true, tables: tables });
    } catch (err) {
      return jsonOut_({ success: false, message: String(err) });
    }
  }
  return ContentService.createTextOutput("Seating API — use ?action=get").setMimeType(
    ContentService.MimeType.TEXT
  );
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (body.action !== "save") {
      return jsonOut_({ success: false, message: "Unknown action" });
    }
    const pwd = String(body.password || "");
    if (pwd !== SEATING_ADMIN_PASSWORD) {
      return jsonOut_({ success: false, message: "Incorrect password" });
    }
    const tables = body.tables;
    if (!tables || typeof tables !== "object") {
      return jsonOut_({ success: false, message: "Missing tables object" });
    }
    writeTablesToSheet_(tables);
    return jsonOut_({ success: true, tables: readTablesFromSheet_() });
  } catch (err) {
    return jsonOut_({ success: false, message: String(err) });
  }
}

function getSeatingSheet_() {
  const ss = SpreadsheetApp.openById(SEATING_SHEET_ID);
  let sheet = ss.getSheetByName(SEATING_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SEATING_SHEET_NAME);
  }
  return sheet;
}

function readTablesFromSheet_() {
  const sheet = getSeatingSheet_();
  const last = sheet.getLastRow();
  /** @type {Record<string, string[]>} */
  const tables = {};

  if (last < 2) return tables;

  const values = sheet.getRange(2, 1, last, 2).getValues();
  for (var i = 0; i < values.length; i++) {
    var rawTable = String(values[i][0] || "").trim();
    var guest = String(values[i][1] || "").trim();
    if (!rawTable || !guest) continue;
    var n = parseInt(rawTable, 10);
    if (!isFinite(n) || n < 1 || String(n) !== rawTable) continue;
    var key = String(n);
    if (!tables[key]) tables[key] = [];
    tables[key].push(guest);
  }

  for (var k in tables) {
    if (Object.prototype.hasOwnProperty.call(tables, k)) {
      var seen = {};
      tables[k] = tables[k].filter(function (name) {
        if (seen[name]) return false;
        seen[name] = true;
        return true;
      });
    }
  }

  return tables;
}

function writeTablesToSheet_(tables) {
  const sheet = getSeatingSheet_();
  sheet.clear();
  sheet.appendRow(["table", "guest"]);

  /** @type {string[]} */
  var keys = Object.keys(tables || {});
  keys.sort(function (a, b) {
    var na = parseInt(a, 10);
    var nb = parseInt(b, 10);
    var aNum = isFinite(na) && String(na) === a;
    var bNum = isFinite(nb) && String(nb) === b;
    if (aNum && bNum) return na - nb;
    if (aNum && !bNum) return -1;
    if (!aNum && bNum) return 1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });

  /** @type {Array<[string, string]>} */
  var rows = [];
  for (var i = 0; i < keys.length; i++) {
    var table = keys[i];
    var guests = tables[table];
    if (!Array.isArray(guests)) continue;
    for (var j = 0; j < guests.length; j++) {
      var name = String(guests[j] || "").trim();
      if (name) rows.push([table, name]);
    }
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Google Apps Script — Event Highlights (guest photo/video + short note)
 *
 * SETUP:
 * 1. Create a Google Drive folder for uploads. Copy its FOLDER_ID from the URL.
 * 2. Create a Google Sheet (can be new). Copy SHEET_ID from the URL.
 *    First sheet tab will get rows: createdAt | note | fileId | mimeType
 * 3. Paste FOLDER_ID and SHEET_ID below.
 * 4. Extensions → Apps Script → paste this file → Deploy → New deployment →
 *    Type: Web app → Execute as: Me → Who has access: Anyone
 * 5. Copy the Web App URL into your site .env as:
 *    VITE_EVENT_HIGHLIGHTS_URL=https://script.google.com/macros/s/XXXX/exec
 * 6. Redeploy after edits (Manage deployments → New version).
 *    Admin delete uses POST JSON: { "action":"delete", "fileId":"..." } (Drive file trashed, sheet row removed).
 * LIMITS: Very large videos may time out (Apps Script ~6 min max; payload limits apply).
 *         For huge files, use YouTube / dedicated hosting and paste links instead (not in this script).
 */

const HIGHLIGHTS_FOLDER_ID = "10Znzbfwxf8rg_tQzG6f2yaLMoPdEYmUT";
const HIGHLIGHTS_SHEET_ID = "1G3B07S8l2VUueKUiM9ztwD-6rguaE10GB0N7053Lbg8";

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || "";
  if (action === "list") {
    try {
      const items = listItemsFromSheet_();
      return jsonOut_({ success: true, items: items });
    } catch (err) {
      return jsonOut_({ success: false, message: String(err) });
    }
  }
  return ContentService.createTextOutput("Event Highlights API — use ?action=list").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (body.action === "delete") {
      deleteHighlight_(body.fileId);
      return jsonOut_({ success: true });
    }
    if (body.action !== "add") {
      return jsonOut_({ success: false, message: "Unknown action" });
    }
    const mimeType = String(body.mimeType || "application/octet-stream");
    const note = String(body.note || "")
      .substring(0, 200)
      .trim();
    const b64 = body.dataBase64;
    if (!b64) {
      return jsonOut_({ success: false, message: "Missing dataBase64" });
    }

    const bytes = Utilities.base64Decode(b64);
    const folder = DriveApp.getFolderById(HIGHLIGHTS_FOLDER_ID);
    const name = "highlight-" + Date.now() + "-" + mimeType.replace(/\//g, "-");
    const blob = Utilities.newBlob(bytes, mimeType, name);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const createdAt = new Date().toISOString();
    appendSheetRow_(createdAt, note, fileId, mimeType);

    return jsonOut_({
      success: true,
      item: { createdAt: createdAt, note: note, fileId: fileId, mimeType: mimeType },
    });
  } catch (err) {
    return jsonOut_({ success: false, message: String(err) });
  }
}

/** Remove Drive file (if present) and sheet row for this fileId. */
function deleteHighlight_(fileId) {
  const id = String(fileId || "").trim();
  if (!id) throw new Error("Missing fileId");
  try {
    DriveApp.getFileById(id).setTrashed(true);
  } catch (ignore) {
    // Already removed or no access
  }
  const ss = SpreadsheetApp.openById(HIGHLIGHTS_SHEET_ID);
  const sheet = ss.getSheets()[0];
  const last = sheet.getLastRow();
  if (last < 2) return;
  const range = sheet.getRange(2, 1, last, 4);
  const values = range.getValues();
  for (var i = 0; i < values.length; i++) {
    var rowFileId = String(values[i][2] || "");
    if (rowFileId === id) {
      sheet.deleteRow(i + 2);
      return;
    }
  }
}

function appendSheetRow_(createdAt, note, fileId, mimeType) {
  const ss = SpreadsheetApp.openById(HIGHLIGHTS_SHEET_ID);
  const sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["createdAt", "note", "fileId", "mimeType"]);
  }
  sheet.appendRow([createdAt, note, fileId, mimeType]);
}

function listItemsFromSheet_() {
  const ss = SpreadsheetApp.openById(HIGHLIGHTS_SHEET_ID);
  const sheet = ss.getSheets()[0];
  if (sheet.getLastRow() < 2) return [];
  const range = sheet.getRange(2, 1, sheet.getLastRow(), 4);
  const values = range.getValues();
  const items = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var ca = row[0];
    if (ca instanceof Date) ca = ca.toISOString();
    items.push({
      createdAt: String(ca),
      note: String(row[1] || ""),
      fileId: String(row[2] || ""),
      mimeType: String(row[3] || ""),
    });
  }
  items.sort(function (a, b) {
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
  return items;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

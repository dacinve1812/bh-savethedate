import React, { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  loadSeating,
  saveSeating,
  getDefaultSeating,
  seatingToCsvLong,
  parseSeatingCsv,
  sortTableKeys,
  suggestNextTableNumber,
} from "../utils/seatingData";
import { ArrowLeft, LogOut, Download, Upload, Save, Plus, Trash2 } from "lucide-react";

const AUTH_KEY = "admin_seating_auth";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "admin";

export default function AdminSeatingPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "1");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#f6f7ef] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-xl font-semibold text-[#1c2321] mb-2">Admin — seating</h1>
          <p className="text-gray-600 text-sm mb-4">Enter the admin password to manage table assignments.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (password === ADMIN_PASSWORD) {
                sessionStorage.setItem(AUTH_KEY, "1");
                setAuthed(true);
                setPasswordError(false);
              } else {
                setPasswordError(true);
              }
            }}
            className="space-y-4"
          >
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              placeholder="Password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c2321] focus:border-transparent"
              autoFocus
            />
            {passwordError && <p className="text-red-600 text-sm">Incorrect password.</p>}
            <button
              type="submit"
              className="w-full py-2 bg-[#1c2321] text-white rounded-lg hover:opacity-90"
            >
              Sign in
            </button>
          </form>
          <Link to="/" className="block mt-4 text-center text-gray-500 text-sm hover:text-[#1c2321]">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminSeatingContent
      onLogout={() => {
        sessionStorage.removeItem(AUTH_KEY);
        setAuthed(false);
      }}
    />
  );
}

function AdminSeatingContent({ onLogout }) {
  const [data, setData] = useState(() => loadSeating());
  const [csvDraft, setCsvDraft] = useState(() => seatingToCsvLong(loadSeating()));
  const [importMsg, setImportMsg] = useState(null);

  const tableKeys = useMemo(() => sortTableKeys(Object.keys(data.tables)), [data.tables]);

  const syncDraftFromData = useCallback((d) => {
    setCsvDraft(seatingToCsvLong(d));
  }, []);

  const handleTableBlur = (table, text) => {
    const guests = text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    setData((prev) => {
      const next = { tables: { ...prev.tables, [table]: guests } };
      syncDraftFromData(next);
      saveSeating(next);
      return next;
    });
  };

  const persist = (next) => {
    saveSeating(next);
    setData(next);
    syncDraftFromData(next);
  };

  const handleAddTable = () => {
    const suggested = suggestNextTableNumber(data);
    const input = window.prompt("Table number (integer ≥ 1)", suggested);
    if (input === null) return;
    const n = parseInt(String(input).trim(), 10);
    if (!Number.isFinite(n) || n < 1) {
      window.alert("Please enter a valid table number (1 or greater).");
      return;
    }
    const key = String(n);
    if (key in data.tables) {
      window.alert(`Table ${key} already exists.`);
      return;
    }
    const next = { tables: { ...data.tables, [key]: [] } };
    persist(next);
    setImportMsg({ type: "ok", text: `Added table ${key}.` });
    setTimeout(() => setImportMsg(null), 2000);
  };

  const handleRemoveTable = (table) => {
    if (!window.confirm(`Remove table ${table} and all guest names on it?`)) return;
    setData((prev) => {
      const tables = { ...prev.tables };
      delete tables[table];
      const next = { tables };
      saveSeating(next);
      syncDraftFromData(next);
      return next;
    });
    setImportMsg({ type: "ok", text: `Removed table ${table}.` });
    setTimeout(() => setImportMsg(null), 2000);
  };

  const handleSaveFromEditor = () => {
    persist(data);
    setImportMsg({ type: "ok", text: "Saved to this browser." });
    setTimeout(() => setImportMsg(null), 2500);
  };

  const handleExportDownload = () => {
    const blob = new Blob([seatingToCsvLong(data)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seating.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsvText = () => {
    try {
      const next = parseSeatingCsv(csvDraft);
      persist(next);
      setImportMsg({ type: "ok", text: "CSV applied and saved." });
    } catch (e) {
      setImportMsg({ type: "err", text: String(e.message || e) });
    }
    setTimeout(() => setImportMsg(null), 4000);
  };

  const handleResetDefaults = () => {
    const next = getDefaultSeating();
    persist(next);
    setImportMsg({ type: "ok", text: "Reset to empty tables (defaults)." });
    setTimeout(() => setImportMsg(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#f6f7ef] text-[#1c2321] pb-12">
      <header className="sticky top-0 z-10 bg-[#f6f7ef]/95 backdrop-blur border-b border-gray-200 px-4 md:px-8 py-4">
        <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-[#1c2321] text-sm">
              <ArrowLeft size={18} /> Home
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
          <h1 className="text-xl font-semibold">Seating assignments</h1>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportDownload}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm flex items-center gap-1"
            >
              <Download size={16} /> Export CSV
            </button>
            <button
              type="button"
              onClick={handleImportCsvText}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm flex items-center gap-1"
            >
              <Upload size={16} /> Import & save CSV
            </button>
            <button
              type="button"
              onClick={handleSaveFromEditor}
              className="px-3 py-2 bg-[#1c2321] text-white rounded-lg hover:opacity-90 text-sm flex items-center gap-1"
            >
              <Save size={16} /> Save tables
            </button>
          </div>
        </div>
        <p className="text-gray-600 text-sm mt-2 max-w-[1200px] mx-auto">
          Edit names per table below, or use CSV: one guest per row <code className="bg-gray-200 px-1 rounded">table,guest</code>.
          You can also use one row per table with multiple names separated by <code className="bg-gray-200 px-1 rounded">;</code> in the second column.
          Data is stored in this browser (localStorage). Export a backup before clearing site data.
        </p>
        {importMsg && (
          <p
            className={`text-sm mt-2 max-w-[1200px] mx-auto ${importMsg.type === "err" ? "text-red-600" : "text-green-700"}`}
          >
            {importMsg.text}
          </p>
        )}
      </header>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-6 space-y-8">
        <section>
          <h2 className="text-lg font-medium mb-2">CSV</h2>
          <textarea
            value={csvDraft}
            onChange={(e) => setCsvDraft(e.target.value)}
            rows={10}
            className="w-full font-mono text-sm p-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-[#5c6f54]/40 focus:border-[#5c6f54]"
            spellCheck={false}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => syncDraftFromData(data)}
              className="text-sm text-gray-600 underline"
            >
              Refresh CSV from tables
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-sm text-gray-600 underline"
            >
              Clear all (reset to empty)
            </button>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-medium">Tables (one name per line)</h2>
            <button
              type="button"
              onClick={handleAddTable}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#5c6f54]/40 bg-white text-sm text-[#1c2321] hover:bg-[#5c6f54]/10"
            >
              <Plus size={16} /> Add table
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tableKeys.map((t) => (
              <TableEditor
                key={t}
                table={t}
                guests={data.tables[t]}
                onCommit={(text) => handleTableBlur(t, text)}
                onRemove={() => handleRemoveTable(t)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function TableEditor({ table, guests, onCommit, onRemove }) {
  const [text, setText] = useState(() => guests.join("\n"));

  React.useEffect(() => {
    setText(guests.join("\n"));
  }, [guests]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-800">Table {table}</h3>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
          title="Remove table"
          aria-label={`Remove table ${table}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onCommit(text)}
        rows={6}
        className="w-full text-sm p-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-[#5c6f54]/30 focus:border-[#5c6f54]"
        placeholder="Guest names…"
      />
      <p className="text-xs text-gray-500 mt-1">{guests.length} guest(s)</p>
    </div>
  );
}

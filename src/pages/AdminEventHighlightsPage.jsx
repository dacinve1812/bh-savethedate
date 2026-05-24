import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  fetchHighlights,
  deleteHighlight,
  isSharedBackendConfigured,
  driveImageThumbUrl,
  highlightVideoPosterUrl,
} from "../utils/eventHighlightsApi";
import { ArrowLeft, LogOut, Trash2 } from "lucide-react";

const AUTH_KEY = "admin_event_highlights_auth";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "admin";

export default function AdminEventHighlightsPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "1");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#f6f7ef] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-xl font-semibold text-[#1c2321] mb-2">Admin — event highlights</h1>
          <p className="text-gray-600 text-sm mb-4">Enter the admin password to remove guest uploads.</p>
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
    <AdminEventHighlightsContent
      onLogout={() => {
        sessionStorage.removeItem(AUTH_KEY);
        setAuthed(false);
      }}
    />
  );
}

function AdminEventHighlightsContent({ onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [msg, setMsg] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchHighlights();
      setItems([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (e) {
      setError(String(e.message || e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleDelete = async (fileId) => {
    if (!window.confirm("Remove this photo or video from Event Highlights? This cannot be undone.")) return;
    setDeletingId(fileId);
    setMsg(null);
    try {
      await deleteHighlight(fileId);
      setMsg({ type: "ok", text: "Removed." });
      await reload();
    } catch (e) {
      setMsg({ type: "err", text: String(e.message || e) });
    } finally {
      setDeletingId(null);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7ef] text-[#1c2321] pb-12">
      <header className="sticky top-0 z-10 bg-[#f6f7ef]/95 backdrop-blur border-b border-gray-200 px-4 md:px-8 py-4">
        <div className="max-w-[1000px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-[#1c2321] text-sm">
              <ArrowLeft size={18} /> Home
            </Link>
            <Link
              to="/event-highlights"
              className="text-sm text-[#5c6f54] hover:text-[#1c2321] underline underline-offset-2"
            >
              Public page
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
          <h1 className="text-xl font-semibold">Event highlights — admin</h1>
        </div>
        {!isSharedBackendConfigured() && (
          <p className="text-amber-800 text-sm max-w-[1000px] mx-auto mt-2">
            No <code className="text-xs bg-amber-100 px-1 rounded">VITE_EVENT_HIGHLIGHTS_URL</code>: you only see and
            delete uploads stored in this browser (demo mode).
          </p>
        )}
        {msg && (
          <p
            className={`text-sm max-w-[1000px] mx-auto mt-2 ${msg.type === "err" ? "text-red-600" : "text-green-700"}`}
          >
            {msg.text}
          </p>
        )}
      </header>

      <div className="max-w-[1000px] mx-auto px-4 md:px-8 mt-6">
        {loading && <p className="text-gray-500 text-sm">Loading…</p>}
        {error && <p className="text-red-600 text-sm py-4">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="text-gray-500 text-sm py-8">No uploads yet.</p>
        )}
        <ul className="grid gap-6 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.fileId}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-[#f0f1ea]">
                <AdminHighlightThumb item={item} />
              </div>
              <div className="p-3 flex-1 flex flex-col gap-2">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                  {formatWhen(item.createdAt)} · {item.mimeType?.split("/")[0] || "file"}
                </p>
                {item.note ? <p className="text-sm text-gray-800 line-clamp-3">{item.note}</p> : null}
                <p className="text-[10px] text-gray-400 font-mono truncate" title={item.fileId}>
                  {item.fileId}
                </p>
                <button
                  type="button"
                  onClick={() => handleDelete(item.fileId)}
                  disabled={deletingId === item.fileId}
                  className="mt-auto inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  {deletingId === item.fileId ? "Removing…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function formatWhen(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

function AdminHighlightThumb({ item }) {
  const isLocal = item.fileId && String(item.fileId).startsWith("local-");
  const isVideo = (item.mimeType || "").startsWith("video/");

  if (isLocal && item._dataUrl) {
    if (isVideo) {
      return (
        <video src={item._dataUrl} muted playsInline className="absolute inset-0 w-full h-full object-cover" />
      );
    }
    return (
      <img src={item._dataUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
    );
  }

  if (!item.fileId) return null;

  if (isVideo) {
    const poster = highlightVideoPosterUrl(item, 320);
    if (poster) {
      return (
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      );
    }
    return <div className="absolute inset-0 bg-[#2a332f] flex items-center justify-center text-white/60 text-xs">Video</div>;
  }

  return (
    <img
      src={driveImageThumbUrl(item.fileId)}
      alt=""
      className="absolute inset-0 w-full h-full object-cover"
      loading="lazy"
    />
  );
}

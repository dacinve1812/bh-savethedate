import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  fetchHighlights,
  uploadHighlight,
  getNoteMax,
  isSharedBackendConfigured,
  driveImageUrl,
  driveVideoPreviewUrl,
} from "../utils/eventHighlightsApi";

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime";

export default function EventHighlightsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadOk, setUploadOk] = useState(false);
  const noteMax = getNoteMax();

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const list = await fetchHighlights();
      setItems(list);
    } catch (e) {
      setLoadError(String(e.message || e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const onPickFile = (e) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    setUploadError("");
    setUploadOk(false);
    e.target.value = "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError("Choose a photo or video first.");
      return;
    }
    setUploading(true);
    setUploadError("");
    setUploadOk(false);
    try {
      await uploadHighlight(file, note);
      setFile(null);
      setNote("");
      setUploadOk(true);
      await reload();
    } catch (err) {
      setUploadError(String(err.message || err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f6f7ef] text-[#1c2321]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24">
        <header className="text-center mb-8 sm:mb-10">
          <Motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="font-serif text-[clamp(1.75rem,5vw,2.5rem)] tracking-tight"
          >
            Event Highlights
          </Motion.h1>
          <p className="mt-3 text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            Share a moment from the day. Uploads appear here in order for everyone to enjoy. Optional short caption
            only — who uploaded is not shown.
          </p>
          {!isSharedBackendConfigured() && (
            <p className="mt-3 text-xs text-amber-800/90 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2 max-w-lg mx-auto">
              Demo mode: uploads stay on this device only. Add{" "}
              <code className="text-[11px] bg-white/80 px-1 rounded">VITE_EVENT_HIGHLIGHTS_URL</code> in{" "}
              <code className="text-[11px] bg-white/80 px-1 rounded">.env</code> (Google Apps Script web app) so guests
              can see each other&apos;s photos and videos.
            </p>
          )}
        </header>

        <section className="mb-10 sm:mb-12 rounded-2xl border border-[#5c6f54]/15 bg-white/70 p-5 sm:p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[#5c6f54] mb-4">Add yours</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1.5">Photo or video</label>
              <label className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 rounded-full text-sm font-medium bg-[#1c2321] text-white cursor-pointer hover:opacity-90 transition-opacity">
                <input type="file" accept={ACCEPT} className="sr-only" onChange={onPickFile} />
                {file ? file.name : "Choose file"}
              </label>
            </div>
            <div>
              <label htmlFor="eh-note" className="block text-xs text-gray-600 mb-1.5">
                Short note (optional, max {noteMax} characters)
              </label>
              <textarea
                id="eh-note"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, noteMax))}
                rows={2}
                maxLength={noteMax}
                placeholder="e.g. Congrats from the dance floor!"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5c6f54]/30 resize-none"
              />
              <p className="text-[11px] text-gray-400 mt-1 text-right">
                {note.length}/{noteMax}
              </p>
            </div>
            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
            {uploadOk && <p className="text-sm text-green-700">Thanks! Your moment was added.</p>}
            <button
              type="submit"
              disabled={uploading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-medium bg-[#5c6f54] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[#5c6f54] mb-4 text-center">
            From everyone
          </h2>
          {loading && <p className="text-center text-gray-500 text-sm py-12">Loading…</p>}
          {loadError && !loading && (
            <p className="text-center text-red-600 text-sm py-8">{loadError}</p>
          )}
          {!loading && !loadError && items.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-12">No moments yet. Be the first to upload.</p>
          )}
          <ul className="grid gap-6 sm:gap-8">
            {items.map((item, idx) => (
              <Motion.li
                key={item.fileId + String(idx)}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.2) }}
                className="rounded-2xl overflow-hidden border border-[#5c6f54]/12 bg-white shadow-sm"
              >
                <HighlightMedia item={item} />
                <div className="px-4 py-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-gray-100/80">
                  <time className="text-[11px] uppercase tracking-wider text-gray-400" dateTime={item.createdAt}>
                    {formatWhen(item.createdAt)}
                  </time>
                  {item.note ? (
                    <p className="text-sm text-[#1c2321] text-right flex-1 min-w-[8rem]">{item.note}</p>
                  ) : null}
                </div>
              </Motion.li>
            ))}
          </ul>
        </section>

        <p className="text-center mt-12">
          <Link to="/" className="text-sm text-[#5c6f54] underline underline-offset-4 hover:text-[#1c2321]">
            ← Home
          </Link>
        </p>
      </div>
    </div>
  );
}

function formatWhen(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

function HighlightMedia({ item }) {
  const isLocal = item.fileId && String(item.fileId).startsWith("local-");
  const isVideo = (item.mimeType || "").startsWith("video/");

  if (isLocal && item._dataUrl) {
    if (isVideo) {
      return (
        <video src={item._dataUrl} controls playsInline className="w-full max-h-[70vh] object-contain bg-black/90" />
      );
    }
    return <img src={item._dataUrl} alt="" className="w-full max-h-[70vh] object-contain bg-[#f6f7ef]" loading="lazy" />;
  }

  if (!item.fileId) return null;

  if (isVideo) {
    return (
      <div className="relative w-full aspect-video bg-black">
        <iframe
          title="Guest video"
          src={driveVideoPreviewUrl(item.fileId)}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <img
      src={driveImageUrl(item.fileId)}
      alt=""
      className="w-full max-h-[80vh] object-contain bg-[#f6f7ef]"
      loading="lazy"
    />
  );
}

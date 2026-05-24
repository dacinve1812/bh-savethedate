import React, { useEffect, useMemo, useState } from "react";
import { driveVideoPreviewUrl, highlightVideoPosterUrl } from "../utils/eventHighlightsApi";
import { shouldDeferVideoIframe, playbackQualityLabel } from "../utils/highlightPlayback";

/**
 * Gallery thumb or lightbox player with poster + adaptive Drive iframe.
 * @param {{ item: import('../utils/eventHighlightsApi').HighlightItem; variant: 'thumb' | 'full' }} props
 */
export default function HighlightVideoPlayer({ item, variant = "thumb" }) {
  const isFull = variant === "full";
  const isLocal = item.fileId && String(item.fileId).startsWith("local-");
  const posterSrc = highlightVideoPosterUrl(item, isFull ? 720 : 480);
  const durationSec = item.durationSec || 0;
  const deferHd = useMemo(() => shouldDeferVideoIframe(durationSec), [durationSec]);

  const [loadHd, setLoadHd] = useState(isFull && !deferHd);
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    if (!isFull) return;
    setLoadHd(!deferHd);
    setIframeReady(false);
  }, [item.fileId, isFull, deferHd]);

  if (isLocal && item._dataUrl) {
    return (
      <video
        src={item._dataUrl}
        poster={item._thumbDataUrl || undefined}
        controls={isFull}
        playsInline
        className={isFull ? "w-full max-h-[min(72vh,680px)] object-contain" : "w-full h-auto block"}
      />
    );
  }

  if (!item.fileId) return null;

  if (!isFull) {
    return (
      <div className="relative w-full bg-[#1c2321]/90 min-h-[120px]">
        {posterSrc ? (
          <img
            src={posterSrc}
            alt=""
            className="w-full h-auto block object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full aspect-[9/16] max-h-64 bg-[#2a332f]" />
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-sm">
            ▶
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-3xl">
      {posterSrc && (!loadHd || !iframeReady) && (
        <img
          src={posterSrc}
          alt=""
          className={`w-full max-h-[min(72vh,680px)] object-contain rounded-xl transition-opacity duration-300 ${
            loadHd && iframeReady ? "opacity-0 absolute inset-0 pointer-events-none" : "opacity-100"
          }`}
          referrerPolicy="no-referrer"
        />
      )}

      {loadHd && (
        <iframe
          title="Guest video"
          src={driveVideoPreviewUrl(item.fileId)}
          onLoad={() => setIframeReady(true)}
          className={`w-full aspect-video max-h-[min(72vh,680px)] border-0 rounded-xl bg-black/40 transition-opacity duration-300 ${
            iframeReady ? "opacity-100 relative" : "opacity-0 absolute inset-0 w-full h-full"
          }`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}

      {!loadHd && (
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-white/70 text-xs text-center max-w-xs">
            Video may take a moment on Google Drive. Tap below when you are on Wi‑Fi or ready for HD.
          </p>
          <button
            type="button"
            onClick={() => setLoadHd(true)}
            className="px-5 py-2.5 rounded-full bg-white/15 text-white text-sm font-medium hover:bg-white/25 transition-colors"
          >
            Play HD video
          </button>
        </div>
      )}

      {loadHd && !iframeReady && (
        <p className="absolute bottom-2 left-0 right-0 text-center text-white/50 text-[11px] pointer-events-none">
          Loading player…
        </p>
      )}

      {isFull && (
        <p className="mt-2 text-center text-white/45 text-[10px]">
          {playbackQualityLabel(deferHd && !iframeReady)}
          {durationSec > 0 ? ` · ${Math.round(durationSec)}s` : ""}
        </p>
      )}
    </div>
  );
}

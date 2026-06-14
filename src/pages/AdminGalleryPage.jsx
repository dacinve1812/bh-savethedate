import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronUp, ChevronDown, Trash2, Copy, RotateCcw, ArrowLeft, Plus, LogOut } from "lucide-react";
import { GALLERY_IMAGES as ALL_IMAGES } from "../galleryImages.generated";
import {
  computeMasonryRowSpan,
  getMasonryGapPx,
  measureMasonryContentHeight,
} from "../utils/masonryLayout";
import { GALLERY_ORDER } from "../galleryConfig";
import { getOptimizedImagePaths } from "../Gallery";

const STORAGE_KEY = "gallery_order";
const AUTH_KEY = "admin_gallery_auth";

/** Mật khẩu admin: đặt trong .env là VITE_ADMIN_PASSWORD. Nếu không đặt, mặc định "admin". */
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "admin";

function getStoredOrder() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return null;
    const a = JSON.parse(s);
    return Array.isArray(a) ? a : null;
  } catch {
    return null;
  }
}

function getDefaultOrder() {
  if (GALLERY_ORDER.length > 0) return [...GALLERY_ORDER];
  return ALL_IMAGES.map((img) => img.src);
}

export default function AdminGalleryPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "1");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#f6f7ef] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-xl font-semibold text-[#1c2321] mb-2">Admin gallery</h1>
          <p className="text-gray-600 text-sm mb-4">Nhập mật khẩu để tiếp tục.</p>
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
              placeholder="Mật khẩu"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c2321] focus:border-transparent"
              autoFocus
            />
            {passwordError && (
              <p className="text-red-600 text-sm">Mật khẩu không đúng.</p>
            )}
            <button
              type="submit"
              className="w-full py-2 bg-[#1c2321] text-white rounded-lg hover:opacity-90"
            >
              Đăng nhập
            </button>
          </form>
          <Link to="/" className="block mt-4 text-center text-gray-500 text-sm hover:text-[#1c2321]">
            ← Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminGalleryContent
      onLogout={() => {
        sessionStorage.removeItem(AUTH_KEY);
        setAuthed(false);
      }}
    />
  );
}

function AdminGalleryContent({ onLogout }) {
  const defaultOrder = getDefaultOrder();
  const [order, setOrder] = useState(() => getStoredOrder() ?? defaultOrder);
  const [copied, setCopied] = useState(false);

  const inGallery = order;
  const available = ALL_IMAGES.filter((img) => !order.includes(img.src));

  const addToGallery = (src) => {
    setOrder((prev) => [...prev, src]);
  };

  const removeFromGallery = (src) => {
    setOrder((prev) => prev.filter((s) => s !== src));
  };

  const moveUp = (index) => {
    if (index <= 0) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index) => {
    if (index >= order.length - 1) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setOrder([...defaultOrder]);
    window.dispatchEvent(new Event("gallery_order_updated"));
  };

  const copyConfig = () => {
    const code = `export const GALLERY_ORDER = ${JSON.stringify(order, null, 2)};`;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f7ef] text-[#1c2321] pb-12">
      {/* Header: toolbar */}
      <header className="sticky top-0 z-10 bg-[#f6f7ef]/95 backdrop-blur border-b border-gray-200 px-4 md:px-8 py-4">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-[#1c2321]"
            >
              <ArrowLeft size={20} /> Về trang chủ
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              <LogOut size={16} /> Thoát
            </button>
          </div>
          <h1 className="text-xl font-semibold">Quản lý gallery</h1>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm flex items-center gap-1"
            >
              <RotateCcw size={14} /> Mặc định
            </button>
            <button
              type="button"
              onClick={copyConfig}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm flex items-center gap-1"
            >
              <Copy size={14} /> {copied ? "Đã copy!" : "Copy config"}
            </button>
          </div>
        </div>
        <p className="text-gray-600 text-sm mt-2 max-w-[1400px] mx-auto">
          Bấm ↑ / ↓ để đổi vị trí từng ảnh, bấm thùng rác để xóa. Bấm ảnh bên dưới để thêm lại.
        </p>
      </header>

      {/* Layout giống gallery: masonry với nút lên/xuống */}
      <section className="gallery admin-gallery">
        <div className="gallery__container">
          <div className="gallery__masonry admin-gallery__masonry">
            {inGallery.map((src, index) => (
              <AdminGalleryTile
                key={src}
                src={src}
                index={index}
                total={inGallery.length}
                onMoveUp={() => moveUp(index)}
                onMoveDown={() => moveDown(index)}
                onRemove={() => removeFromGallery(src)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Có thể thêm lại */}
      {available.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 md:px-8 mt-8">
          <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Plus size={18} /> Thêm ảnh vào gallery
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {available.map((img) => (
              <button
                key={img.src}
                type="button"
                onClick={() => addToGallery(img.src)}
                className="rounded-lg border border-gray-200 overflow-hidden bg-white hover:border-[#1c2321] hover:ring-2 hover:ring-[#1c2321]/20 transition-all"
              >
                <AdminThumb src={img.src} />
                <span className="block text-xs truncate p-1.5 text-gray-600">
                  {img.src.replace(/^\//, "")}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <p className="text-gray-500 text-xs mt-6 max-w-[1400px] mx-auto px-4">
        &quot;Copy config&quot;: dán vào <code className="bg-gray-200 px-1 rounded">src/galleryConfig.js</code> để giữ thứ tự khi deploy.
      </p>
    </div>
  );
}


function AdminGalleryTile({ src, index, total, onMoveUp, onMoveDown, onRemove }) {
  const paths = getOptimizedImagePaths(src);
  const thumbSrc = paths?.thumbnail || src;
  const canMoveUp = index > 0;
  const canMoveDown = index < total - 1;

  const contentRef = useRef(null);
  const [rowSpan, setRowSpan] = useState(400);
  const rafRef = useRef(null);

  const recalcSpan = useCallback(() => {
    const wrapper = contentRef.current;
    if (!wrapper) return;
    const grid = wrapper.closest(".gallery__masonry");
    const gapPx = getMasonryGapPx(grid);
    const wrapperH = measureMasonryContentHeight(wrapper);
    if (wrapperH <= 0) return;
    setRowSpan(computeMasonryRowSpan(wrapperH, gapPx));
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const scheduleRecalc = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        recalcSpan();
      });
    };
    const ro = new ResizeObserver(scheduleRecalc);
    ro.observe(el);
    scheduleRecalc();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [recalcSpan]);

  const handleImageLoad = useCallback(
    (e) => {
      const img = e.target;
      const wrapper = contentRef.current;
      if (wrapper && img.naturalWidth > 0 && img.naturalHeight > 0) {
        wrapper.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
        requestAnimationFrame(() => recalcSpan());
      }
    },
    [recalcSpan]
  );

  return (
    <div
      className="gallery__item admin-gallery__item"
      style={{ gridRowEnd: `span ${rowSpan}` }}
    >
      <div
        ref={contentRef}
        className="gallery__image-wrapper admin-gallery__tile-wrapper"
      >
        <img
          src={thumbSrc}
          alt=""
          className="gallery__image gallery__image--loaded"
          draggable={false}
          onLoad={handleImageLoad}
        />
        <div className="admin-gallery__tile-overlay">
          <div className="admin-gallery__order-btns">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="admin-gallery__order-btn"
              aria-label="Lên một vị trí"
              title="Lên một vị trí"
            >
              <ChevronUp size={20} />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="admin-gallery__order-btn"
              aria-label="Xuống một vị trí"
              title="Xuống một vị trí"
            >
              <ChevronDown size={20} />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="admin-gallery__remove-btn"
            aria-label="Xóa khỏi gallery"
            title="Xóa khỏi gallery"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminThumb({ src }) {
  const paths = getOptimizedImagePaths(src);
  const thumbSrc = paths?.thumbnail || src;
  return (
    <div className="aspect-[4/3] bg-gray-100">
      <img src={thumbSrc} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

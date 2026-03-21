# ✅ Gallery Setup – Responsive Thumbnails (DPR)

## 🎯 Tóm tắt

Gallery dùng **3 size thumbnail** (240w, 400w, 600w) + **srcset/sizes** để trình duyệt tự chọn ảnh theo DPR và viewport → thumb **nét trên cả mobile và desktop**, không bị mờ do DPR 2–3.

## 📐 Vì sao cần 4 size thumb (240 / 400 / 600 / 800)?

- Ô thumb tại 432px: 50vw ≈ 216px CSS.
- **DPR 1**: 240w đủ.
- **DPR 2**: 216×2 = 432 → **600w** (400w thiếu).
- **DPR 3**: 216×3 = 648 → **800w** (600w vẫn thiếu → mờ).

Nên cần thêm **800w** để tại max-width 432px vẫn nét trên DPR 3. `sizes` dùng **55vw** cho mobile để trình duyệt chọn 600w/800w thay vì 400w.

## 📁 Cấu trúc sau khi chạy script

```
public/images/
├── original/          (tùy chọn – ảnh gốc)
├── thumbnails/        ✅ 4 file WebP mỗi ảnh (đúng chữ **thumbnails**, không phải thumnails)
│   ├── DSC02431_JPG-240.webp   (~10–25 KB)
│   ├── DSC02431_JPG-400.webp   (~20–45 KB)
│   ├── DSC02431_JPG-600.webp   (~35–80 KB)
│   ├── DSC02431_JPG-800.webp   (~50–100 KB, cho DPR3 tại 432px)
│   └── ...
└── full/              ✅ 1 file full cho viewer (1600–2400w)
    ├── DSC02431_JPG.jpg
    └── ...
```

- **thumbnails/**: đặt tên `safeBaseName-240.webp`, `-400.webp`, `-600.webp`, `-800.webp` (WebP, có sharpen nhẹ).
- **full/**: dùng cho lightbox, không dùng original (quá nặng).

## 🖼️ Thêm ảnh vào gallery – tự động (không cần gõ tay)

1. **Cho ảnh vào** `public/images/original/` (bất kỳ file .jpg / .jpeg / .png nào).
2. Chạy **một lệnh**: `npm run optimize-images`.
3. Script sẽ:
   - Tạo thumbnails + full trong `public/images/thumbnails/` và `public/images/full/`,
   - **Tự động cập nhật** `src/galleryImages.generated.js` với danh sách tất cả ảnh trong `original/`.
4. Gallery đọc danh sách từ **`src/galleryImages.generated.js`** (không quét thư mục `thumbnails`/`full` lúc chạy app). Chỉ copy tay file vào `thumbnails`/`full` **mà không** có ảnh trong `original/` + không chạy script → file generated **không có** ảnh đó → gallery sẽ **không** hiện.

**Đã có sẵn file trong thumbnails/full?** Vẫn cần **một file gốc cùng tên logic** trong `public/images/original/` (có thể cùng nội dung ảnh bạn muốn), rồi chạy `npm run optimize-images`. Script sẽ bỏ qua bước encode nếu output đã đủ mới, nhưng vẫn **cập nhật** `galleryImages.generated.js`.

Nếu chưa có thư mục `public/images/original/`, script sẽ dùng ảnh trong `public/` (và vẫn sinh danh sách gallery từ đó).

### Chọn ảnh và sắp xếp thứ tự

**Cách 1 – Trang Admin (giao diện):** Mở **`/admin`**. Trang được bảo vệ bằng mật khẩu (chỉ admin). Tại đây bạn có thể:
- Xem layout giống gallery; **kéo icon ☰** trên ảnh để sắp xếp, **bấm thùng rác** để xóa khỏi gallery.
- Phần dưới: bấm ảnh để **thêm lại** vào gallery.
- **Lưu** → áp dụng ngay trên trình duyệt (localStorage).
- **Copy config** → dán vào `src/galleryConfig.js` để giữ thứ tự khi deploy.
- **Mật khẩu:** đặt trong file `.env`: `VITE_ADMIN_PASSWORD=your_password`. Nếu không đặt, mặc định là `admin`.

**Cách 2 – Chỉnh file:** Mở **`src/galleryConfig.js`**:

- **`GALLERY_ORDER = []`** (mảng rỗng) → gallery hiển thị **tất cả** ảnh trong `galleryImages.generated.js`, theo thứ tự tên file.
- **`GALLERY_ORDER` có phần tử** → giữ **thứ tự** trong file; mọi ảnh **mới** trong generated (sau khi chạy script) mà chưa có trong `GALLERY_ORDER` sẽ **tự nối vào cuối** — **chỉ khi** bạn chưa lưu thứ tự riêng trong trình duyệt (localStorage từ `/admin`). Nếu đã chỉnh bằng Admin, thêm ảnh mới từ mục **“Thêm ảnh vào gallery”** bên dưới.
- Muốn **ẩn** ảnh khỏi gallery: dùng trang **`/admin`** (xóa khỏi danh sách) hoặc bỏ ảnh khỏi `original/` + chạy lại script.

Ví dụ:

```js
export const GALLERY_ORDER = [
  "/NP__7180.JPG",
  "/DSC02431.JPG",
  "/NP__7930.JPG",
];
```

Ví dụ trên: nếu `GALLERY_ORDER` chỉ liệt kê 3 ảnh, trước đây chỉ 3 ảnh đó hiện; **hiện tại** các ảnh khác trong generated vẫn **tự nối vào sau** (trừ khi bạn dùng Admin để giới hạn và lưu localStorage). Tên `src` phải trùng với entry trong `galleryImages.generated.js`.

## 🔧 Script: `npm run optimize-images`

Script tạo:

1. **4 thumbnail** mỗi ảnh: 240, 400, 600, 800 px width, WebP, quality 80, sharpen nhẹ.
2. **1 full** mỗi ảnh: nén, giữ chất lượng cho viewer.
3. **Danh sách gallery**: ghi `src/galleryImages.generated.js` (Gallery import từ đây).

Cấu hình trong `scripts/optimizeImages.cjs`:

- `thumbnailWidths: [240, 400, 600]`
- `thumbnailFormat: 'webp'`
- Input: `public/images/original/` hoặc fallback `public/`

Chạy lại script sau khi thêm/sửa ảnh; script skip ảnh đã optimize (so sánh thời gian file).

## 🖼️ UI: srcset + sizes

Trong Gallery, mỗi tile dùng:

- **sizes**: `(max-width: 432px) 55vw, 200px`  
  - Mobile &lt;432px: 55vw (~238px) để trình duyệt chọn 600w/800w thay vì 400w.  
  - Lớn hơn: ~200px (grid).
- **srcset**:  
  `.../X-240.webp 240w, .../X-400.webp 400w, .../X-600.webp 600w, .../X-800.webp 800w`

Trình duyệt tự chọn:

- DPR 1 → 240w
- DPR 2 (tại 432px) → 600w (đủ nét)
- DPR 3 (tại 432px) → 800w (đủ nét)

Áp dụng cho **cả mobile và desktop** (DPR và viewport khác nhau).

## 📝 Helper trong code

`getOptimizedImagePaths(originalSrc)` (trong `Gallery.jsx`) trả về:

- `thumbnail`: URL 400w (fallback cho `src`).
- `fullSize`: URL ảnh full cho viewer.
- `thumbnailSrcSet`: chuỗi `"url 240w, url 400w, url 600w, url 800w"`.
- `thumbnailSizes`: `"(max-width: 432px) 55vw, 200px"`.

Gallery tile:

- `src={thumbnail}` (fallback).
- `srcSet={thumbnailSrcSet}`.
- `sizes={thumbnailSizes}`.

## ✅ Checklist

- [ ] Đặt ảnh vào `public/images/original/`.
- [ ] Chạy `npm run optimize-images` (tạo thumb/full + cập nhật danh sách gallery).
- [x] `getOptimizedImagePaths` trả về srcset + sizes.
- [x] Gallery `<img>` dùng `src`, `srcSet`, `sizes`.
- [x] Full-size dùng cho MediaViewer/lightbox; không dùng original.

## 🎉 Kết quả

- Thumb **nét** trên mobile (DPR 2–3) và desktop.
- **Nhẹ**: DPR1 tải 240w, DPR2 400w, DPR3 600w, không tải dư.
- Cấu trúc gọn: 1 folder `thumbnails/`, naming `name-240.webp` / `-400.webp` / `-600.webp` / `-800.webp`.

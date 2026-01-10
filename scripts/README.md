# Image Optimization Guide

## Tổng quan

Script này giúp tối ưu hóa ảnh cho gallery bằng cách:
- Tạo thumbnails nhỏ (600px width, ~50-200KB) để load nhanh trong gallery
- Optimize full-size images (compress nhưng giữ chất lượng, ~1-5MB)
- Giảm đáng kể thời gian load và bandwidth

## Cài đặt

1. **Install dependencies:**
```bash
npm install
```

Script sẽ tự động install `sharp` (image processing library) vào devDependencies.

## Cách sử dụng

### Bước 1: Chuẩn bị ảnh

1. Tạo thư mục `public/images/original/`
2. Copy tất cả ảnh gốc vào thư mục này
3. Hỗ trợ format: `.jpg`, `.jpeg`, `.png` (case-insensitive)

### Bước 2: Chạy script

```bash
npm run optimize-images
```

Hoặc:

```bash
node scripts/optimizeImages.js
```

### Bước 3: Kết quả

Script sẽ tạo:
- **Thumbnails**: `public/images/thumbnails/` (600px width, JPEG, quality 80%)
- **Full-size optimized**: `public/images/full/` (compressed, quality 85%)

### Bước 4: Cập nhật Gallery.jsx

Sau khi có thumbnails và full-size images, cập nhật `GALLERY_IMAGES trong `Gallery.jsx`:

```javascript
export const GALLERY_IMAGES = [
  { 
    thumbnail: "/images/thumbnails/DSC02431.jpg", 
    fullSize: "/images/full/DSC02431.JPG", 
    alt: "Wedding moment 2" 
  },
  { 
    thumbnail: "/images/thumbnails/NP__7045.jpg", 
    fullSize: "/images/full/NP__7045.JPG", 
    alt: "Wedding moment 3" 
  },
  // ... rest of images
];
```

## Cấu hình

Bạn có thể chỉnh sửa settings trong `scripts/optimizeImages.js`:

```javascript
const CONFIG = {
  thumbnailWidth: 600,      // Width của thumbnail (px)
  thumbnailQuality: 80,     // Quality của thumbnail (0-100)
  fullQuality: 85,         // Quality của full-size (0-100)
};
```

## Lợi ích

### Trước khi optimize:
- Mỗi ảnh: **23-30MB**
- Load 13 ảnh: **~300-400MB**
- Thời gian load: **Rất lâu** (phụ thuộc vào bandwidth)

### Sau khi optimize:
- Thumbnail: **50-200KB** (giảm ~99%)
- Full-size: **1-5MB** (giảm ~80-90%)
- Load 13 thumbnails: **~1-3MB** (giảm ~99%)
- Thời gian load: **Nhanh hơn rất nhiều**

### Với 750-1000 ảnh:
- **Trước**: ~17-30GB total
- **Sau**: ~500MB-2GB thumbnails + ~750MB-5GB full-size = **~1.25-7GB total**
- **Giảm ~70-80%** tổng dung lượng

## Tips

1. **Batch processing**: Script tự động xử lý tất cả ảnh trong thư mục
2. **Progress tracking**: Script hiển thị progress và stats cho mỗi ảnh
3. **Error handling**: Nếu một ảnh fail, script vẫn tiếp tục với ảnh khác
4. **Size reduction**: Script hiển thị % giảm size cho mỗi ảnh

## Troubleshooting

### Lỗi: "Cannot find module 'sharp'"
```bash
npm install sharp
```

### Lỗi: "Input directory not found"
- Đảm bảo đã tạo thư mục `public/images/original/`
- Đảm bảo có ít nhất 1 ảnh trong thư mục

### Ảnh không được optimize đúng cách
- Kiểm tra format ảnh (chỉ hỗ trợ JPG, PNG)
- Kiểm tra permissions của thư mục output

## Notes

- Script giữ nguyên aspect ratio
- Thumbnails luôn được convert sang JPEG để tối ưu size
- Full-size PNG sẽ giữ format PNG, JPG sẽ được optimize
- Original images không bị thay đổi (chỉ đọc, không ghi)


# 📖 Cách Script Hoạt Động

## 🎯 Tóm Tắt Nhanh

**Bạn KHÔNG CẦN tạo thư mục thủ công!** Script sẽ tự động:
- ✅ Tìm ảnh trong `public/` hoặc `public/images/original/`
- ✅ Tự động tạo thư mục `public/images/thumbnails/` và `public/images/full/`
- ✅ Generate thumbnails và optimize full-size images
- ✅ Báo cáo kết quả và hướng dẫn next steps

## 🔄 Quy Trình Hoạt Động

### Bước 1: Tìm Ảnh (Tự Động)
Script sẽ tìm ảnh theo thứ tự ưu tiên:

1. **Ưu tiên 1**: `public/images/original/`
   - Nếu thư mục này tồn tại và có ảnh → dùng thư mục này

2. **Fallback**: `public/` 
   - Nếu không tìm thấy ở bước 1, script sẽ:
     - Scan toàn bộ thư mục `public/`
     - Tìm tất cả file `.jpg`, `.jpeg`, `.png` (case-insensitive)
     - Tự động bỏ qua thư mục `images/` để tránh xử lý lại output

### Bước 2: Tạo Thư Mục Output (Tự Động)
Script tự động tạo (nếu chưa có):
- ✅ `public/images/thumbnails/` - Chứa thumbnails nhỏ
- ✅ `public/images/full/` - Chứa full-size optimized

### Bước 3: Xử Lý Từng Ảnh
Với mỗi ảnh tìm được:

1. **Generate Thumbnail**:
   - Resize xuống 600px width (giữ aspect ratio)
   - Convert sang JPEG, quality 80%
   - Output: `public/images/thumbnails/[tên_ảnh].jpg`
   - Size: ~50-200KB

2. **Optimize Full-Size**:
   - Giữ nguyên kích thước gốc
   - Compress với quality 85%
   - Format: JPEG (hoặc PNG nếu ảnh gốc là PNG)
   - Output: `public/images/full/[tên_ảnh].jpg` (hoặc `.png`)
   - Size: ~1-5MB (giảm từ 23-30MB)

3. **Báo Cáo**:
   - Hiển thị progress cho mỗi ảnh
   - Tính toán % giảm size
   - Tổng hợp stats cuối cùng

## 📁 Cấu Trúc Thư Mục (Sau Khi Chạy Script)

```
public/
├── images/
│   ├── original/          # (Optional) Nếu bạn muốn tổ chức
│   ├── thumbnails/        # ✅ Script tự tạo - Thumbnails nhỏ
│   └── full/              # ✅ Script tự tạo - Full-size optimized
├── DSC02431.JPG           # Ảnh gốc (không bị xóa)
├── NP__7045.JPG           # Ảnh gốc (không bị xóa)
└── ...                    # Các ảnh khác
```

## 🚀 Cách Sử Dụng Đơn Giản Nhất

### Option 1: Bỏ ảnh vào `/public/` (Đơn giản nhất)

```bash
# 1. Bỏ tất cả ảnh vào thư mục public/
# Ví dụ: public/DSC02431.JPG, public/NP__7045.JPG, ...

# 2. Chạy script
npm run optimize-images

# 3. Xong! Script tự tạo thumbnails và full-size
```

### Option 2: Tổ chức trong thư mục riêng (Recommended)

```bash
# 1. Tạo thư mục (hoặc để script tự tạo)
mkdir public/images/original

# 2. Bỏ ảnh vào đó
# public/images/original/DSC02431.JPG, ...

# 3. Chạy script
npm run optimize-images

# 4. Xong!
```

## 📊 Ví Dụ Output

```
🖼️  Image Optimization Script
==================================================

✓ Directory created/verified: .../public/images/thumbnails
✓ Directory created/verified: .../public/images/full

📸 Found 13 image(s) to process
   Source: .../public/

Processing: DSC02431.JPG (25.3 MB)
  ✓ Thumbnail: DSC02431.jpg (0.15 MB)
  ✓ Full-size: DSC02431.jpg (3.2 MB)
  📊 Size reduction: 87.4%

...

==================================================

📊 Summary:

  ✓ Successfully processed: 13 image(s)
  
  Original total size: 329.50 MB
  Thumbnails total size: 2.10 MB
  Full-size total size: 38.70 MB
  Total reduction: 88.3%

📝 Next steps:
  1. Update GALLERY_IMAGES in Gallery.jsx with thumbnail and fullSize paths
  2. Example format:
     { thumbnail: "/images/thumbnails/image.jpg", fullSize: "/images/full/image.jpg", alt: "Description" }
```

## ⚠️ Lưu Ý Quan Trọng

1. **Ảnh gốc KHÔNG bị xóa**: Script chỉ đọc, không ghi đè ảnh gốc
2. **Tự động tạo thư mục**: Không cần tạo thủ công
3. **Hỗ trợ nhiều định dạng**: `.jpg`, `.jpeg`, `.png` (case-insensitive)
4. **Recursive search**: Nếu bỏ ảnh vào subfolder trong `public/`, script vẫn tìm được
5. **Skip output folders**: Script tự động bỏ qua `images/` folder để tránh xử lý lại

## 🎨 Sau Khi Chạy Script

Cập nhật `Gallery.jsx`:

```javascript
export const GALLERY_IMAGES = [
  { 
    thumbnail: "/images/thumbnails/DSC02431.jpg", 
    fullSize: "/images/full/DSC02431.jpg", 
    alt: "Wedding moment 2" 
  },
  // ... rest
];
```

## 💡 Tips

- **Lần đầu**: Bỏ ảnh vào `public/` và chạy script để test
- **Production**: Tổ chức trong `public/images/original/` cho gọn
- **Batch processing**: Script xử lý tất cả ảnh cùng lúc
- **Error handling**: Nếu 1 ảnh fail, script vẫn tiếp tục với ảnh khác


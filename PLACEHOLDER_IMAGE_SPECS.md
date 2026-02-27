# Image Placeholder Specifications

## Tổng quan

Placeholder images được dùng để giữ cấu trúc page khi ảnh thật đang load, tránh layout shift và cải thiện UX.

## Kích thước (Dimensions)

### **Gallery Thumbnails (Landscape)**
- **Width:** 600px (theo script optimizeImages.cjs)
- **Height:** Auto (tỷ lệ 4:3 hoặc theo ảnh gốc)
- **Aspect Ratio:** 4:3 (landscape) hoặc theo ảnh thật
- **Use case:** Hiển thị trong gallery grid

### **Lightbox Full-size (Responsive)**
- **Max Width:** 95vw (95% viewport width)
- **Max Height:** 85vh (85% viewport height)
- **Aspect Ratio:** Giữ nguyên tỷ lệ ảnh gốc
- **Use case:** Hiển thị trong lightbox modal

---

## File Size Recommendations

### **Option 1: CSS-only Placeholder (Khuyến nghị)** ⭐
- **File size:** 0 bytes (không cần file ảnh)
- **Method:** Dùng CSS gradient + shimmer animation
- **Pros:** 
  - Không cần tải thêm file
  - Load ngay lập tức
  - Không tốn bandwidth
- **Cons:** 
  - Không có hình ảnh thật
  - Chỉ có màu nền + icon

**Đã implement:** Component `ImagePlaceholder` dùng CSS-only

---

### **Option 2: Tiny Placeholder Images** (Nếu muốn có hình ảnh)

Nếu bạn muốn có placeholder images thật (ví dụ: blur-up technique):

#### **Landscape Placeholder:**
- **Dimensions:** 600 x 450px (4:3 ratio)
- **Format:** JPEG hoặc WebP
- **Quality:** 20-30% (rất thấp, chỉ để blur)
- **File size:** **5-15 KB** (rất nhỏ)
- **Color:** Dominant color từ ảnh gốc hoặc màu trung tính

#### **Portrait Placeholder:**
- **Dimensions:** 450 x 600px (3:4 ratio)
- **Format:** JPEG hoặc WebP
- **Quality:** 20-30%
- **File size:** **5-15 KB**
- **Color:** Dominant color từ ảnh gốc

#### **Square Placeholder:**
- **Dimensions:** 600 x 600px (1:1 ratio)
- **Format:** JPEG hoặc WebP
- **Quality:** 20-30%
- **File size:** **5-15 KB**

---

## Best Practices

### **1. CSS-only (Current Implementation)**
✅ **Khuyến nghị** - Đã implement
- Không cần file ảnh
- Load ngay lập tức
- Shimmer effect đẹp

### **2. Blur-up Technique** (Nếu muốn nâng cao)
- Tạo tiny blur version của mỗi ảnh (5-15KB)
- Hiển thị blur version trước
- Fade in ảnh thật khi load xong
- **Pros:** Có preview ảnh thật
- **Cons:** Cần generate thêm file cho mỗi ảnh

### **3. Dominant Color Placeholder**
- Extract dominant color từ ảnh
- Dùng màu đó làm background
- **Pros:** Có màu sắc từ ảnh thật
- **Cons:** Cần process ảnh để extract color

---

## Implementation Details

### **Gallery Placeholder:**
- Type: `landscape` (4:3 ratio)
- Background: Gradient gray (#f0f0f0 → #e0e0e0)
- Animation: Shimmer effect
- Icon: Image icon (48x48px, gray)

### **Lightbox Placeholder:**
- Type: Responsive (theo ảnh thật)
- Background: Dark gradient (#1a1a1a → #2a2a2a)
- Animation: Shimmer effect
- Icon: Image icon (64x64px, white/transparent)

---

## Nếu muốn tạo Placeholder Images thật

### **Tools:**
1. **ImageMagick** (command line)
2. **Sharp** (Node.js - đã có trong project)
3. **Online tools:** TinyPNG, Squoosh

### **Command Example (ImageMagick):**
```bash
# Landscape placeholder (600x450, quality 25%, blur)
convert input.jpg -resize 600x450 -quality 25 -blur 0x8 placeholder-landscape.jpg

# Portrait placeholder (450x600, quality 25%, blur)
convert input.jpg -resize 450x600 -quality 25 -blur 0x8 placeholder-portrait.jpg
```

### **Sharp Script Example:**
```javascript
const sharp = require('sharp');

// Generate landscape placeholder
await sharp('input.jpg')
  .resize(600, 450, { fit: 'cover' })
  .jpeg({ quality: 25 })
  .blur(8)
  .toFile('placeholder-landscape.jpg');

// Generate portrait placeholder
await sharp('input.jpg')
  .resize(450, 600, { fit: 'cover' })
  .jpeg({ quality: 25 })
  .blur(8)
  .toFile('placeholder-portrait.jpg');
```

---

## Kết luận

**Hiện tại đã implement CSS-only placeholder:**
- ✅ Không cần file ảnh
- ✅ Load ngay lập tức
- ✅ Shimmer effect đẹp
- ✅ Giữ cấu trúc page

**Nếu muốn nâng cao:**
- Có thể tạo tiny blur images (5-15KB mỗi ảnh)
- Hoặc extract dominant color
- Nhưng CSS-only đã đủ tốt cho hầu hết trường hợp

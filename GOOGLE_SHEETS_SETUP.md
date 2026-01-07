# Hướng dẫn thiết lập Google Sheets để nhận dữ liệu RSVP

## Bước 1: Tạo Google Sheet

1. Mở Google Drive và tạo một Google Sheet mới
2. Đặt tên file (ví dụ: "Wedding RSVP Responses")
3. Tạo header row với các cột sau (dòng 1):
   - Timestamp
   - Full Name
   - Attending
   - Number of Guests
   - Dietary Preference
   - Guest Names
   - Comments

## Bước 2: Tạo Google Apps Script

1. Trong Google Sheet, click vào **Extensions** → **Apps Script**
2. Xóa code mặc định và paste code từ file `google-apps-script.js`
3. Lưu project (Ctrl+S hoặc Cmd+S)
4. Đặt tên project (ví dụ: "RSVP Form Handler")

## Bước 3: Deploy Web App

1. Click vào **Deploy** → **New deployment**
2. Click vào biểu tượng bánh răng ⚙️ bên cạnh "Select type" → chọn **Web app**
3. Điền thông tin:
   - **Description**: "RSVP Form Handler"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. Click **Deploy**
5. **QUAN TRỌNG**: Copy URL Web App (sẽ có dạng: `https://script.google.com/macros/s/...`)
6. Click **Authorize access** và cho phép quyền truy cập

## Bước 4: Lấy Sheet ID

1. Trong Google Sheet, URL sẽ có dạng:
   `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
2. Copy phần `SHEET_ID_HERE` (đây là Sheet ID)

## Bước 5: Cập nhật code

1. Mở file `RSVPPage.jsx`
2. Tìm dòng có `const GOOGLE_SCRIPT_URL = ""`
3. Paste URL Web App vào đó
4. Tìm dòng có `const SHEET_ID = ""`
5. Paste Sheet ID vào đó

## Bước 6: Test

1. Chạy ứng dụng: `npm run dev`
2. Điền form và submit
3. Kiểm tra Google Sheet để xem dữ liệu đã được ghi chưa

## Lưu ý

- Mỗi lần submit form sẽ thêm một dòng mới vào Google Sheet
- Timestamp sẽ tự động được thêm
- Nếu có lỗi, kiểm tra Console trong browser để xem thông báo lỗi


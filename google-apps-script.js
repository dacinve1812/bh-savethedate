/**
 * Google Apps Script để nhận dữ liệu từ form và ghi vào Google Sheets
 * 
 * Hướng dẫn:
 * 1. Tạo Google Sheet mới với header: Timestamp, Full Name, Attending, Number of Guests, Dietary Preference, Guest Names, Comments
 * 2. Copy Sheet ID từ URL (phần giữa /d/ và /edit)
 * 3. Paste Sheet ID vào biến SHEET_ID bên dưới
 * 4. Deploy script này như Web App
 * 5. Copy Web App URL và paste vào RSVPPage.jsx
 */

// THAY ĐỔI SHEET_ID CỦA BẠN Ở ĐÂY
const SHEET_ID = '1snFy4fLQK2xyDS9gF3l1cnQZY8pmhKR6SjCRaHiIqrI';
const SHEET_NAME = 'Sheet1'; // Hoặc tên sheet của bạn

function doPost(e) {
  try {
    // Lấy dữ liệu từ request
    const data = JSON.parse(e.postData.contents);
    
    // Mở Google Sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // Nếu sheet trống, thêm header
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Full Name',
        'Attending',
        'Number of Guests',
        'Dietary Preference',
        'Guest Names',
        'Comments'
      ]);
    }
    
    // Chuẩn bị dữ liệu để ghi
    const timestamp = new Date();
    const numberOfGuests = data.numberOfGuests === 'other' 
      ? data.numberOfGuestsOther || data.numberOfGuests
      : data.numberOfGuests;
    
    // Ghi dữ liệu vào sheet
    sheet.appendRow([
      timestamp,
      data.fullName || '',
      data.attending || '',
      numberOfGuests || '',
      data.dietaryPreference || '',
      data.guestNames || '',
      data.comments || ''
    ]);
    
    // Trả về response thành công
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: 'RSVP submitted successfully!'
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Trả về response lỗi
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Test function để kiểm tra script hoạt động
  return ContentService.createTextOutput('RSVP Form Handler is running!').setMimeType(ContentService.MimeType.TEXT);
}


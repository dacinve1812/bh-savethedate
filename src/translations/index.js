import { customVietnameseTranslations } from './customTranslations';

export const translations = {
  en: {
    // Initial page
    openMe: "Open me!",
    selectLanguage: "Select Language",
    vietnamese: "Vietnamese",
    english: "English",
    
    // TopNav
    home: "Home",
    gallery: "Gallery",
    rsvp: "RSVP",
    timeline: "Timeline",
    
    // Gallery
    galleryEyebrow: "Our Memories",
    galleryTitle: "Pre-Wedding Gallery",
    galleryEmpty: "Photos coming soon.",
    galleryEmptyLiked: "No liked photos in this album yet.",
    galleryShowAll: "All photos",
    galleryCategoryLabels: {
      "pre-wedding": "Pre-Wedding",
      "phong-su": "Hình Phóng Sự",
      "truyen-thong": "Hình Truyền thống",
      photobooth: "Photobooth",
      "guest-moments": "Guest Moments",
    },
    guestMomentsUploadTitle: "Upload your moment",
    guestMomentsUploadHint: "Photos any size · Videos up to 30s",
    galleryPhotoboothSubLabels: {
      photobooth: "Photobooth",
      single: "Single",
    },
    galleryCategoryTitles: {
      "pre-wedding": "Pre-wedding",
      "phong-su": "Hình Phóng Sự",
      "truyen-thong": "Hình Truyền thống",
      photobooth: "Photobooth",
    },
    
    // Schedule
    scheduleEyebrow: "The Day's Events",
    scheduleHeading: "Wedding Day Timeline",
    scheduleDate: "May 30, 2026",
    addToCalendar: "Add to Calendar",
    calendarModalTitle: "Add to Calendar",
    
    // Formal Invitation
    formalInvitationText: "Formal invitation to follow",
    formalInvitationDate: "05.30.2026",
    
    // Location
    location: "Location",
    locationVenueName: "Venue Name",
    locationAddress: "Venue Address, City",
    locationTime: "From 5:00 PM to 1:00 AM",
    openInMaps: "Open in Maps",
    googleMaps: "Google Maps",
    appleMaps: "Apple Maps",
    
    // Album (replaces RSVP CTA on home)
    albumMessage: "See more wedding photos of Bao and Hau here.",
    albumButton: "See Album",
    seeAlbum: "See Album",
    
    // RSVP (legacy — page hidden)
    rsvpMessage: "We would sincerely appreciate your response to facilitate our preparations.",
    rsvpButton: "RSVP",
    rsvpTitle: "RSVP",
    rsvpSubtitle: "Kindly confirm your attendance by completing the RSVP form below",
    weddingTitle: "Bao & Hau's Wedding",
    findYourName: "Find your name",
    required: "(required)",
    namePlaceholder: "Type your name as on the card...",
    willAttend: "Will you be attending?",
    yes: "Yes",
    no: "No",
    numberOfGuests: "Number of guests",
    selectGuests: "Select number of guests",
    other: "Other",
    enterGuests: "Enter number of guests",
    guestNames: "Names of Guests in your Party",
    dietaryPreference: "Vegetarian or Non-vegetarian",
    vegetarian: "Vegetarian",
    nonVegetarian: "Non-vegetarian",
    questionsComments: "Questions or Comments",
    submit: "Submit",
    submitting: "Submitting...",
    submitSuccess: "Thank you! Your RSVP has been submitted successfully.",
    submitError: "Sorry, there was an error submitting your RSVP. Please try again.",
    
    // ChanceEncounter
    chanceTitle: "Tie the Knot",
    chanceP1: "After <fc>years</fc> of laughter, adventures, and countless shared memories, we're <fc>finally</fc> taking the next step in our journey together.",
    chanceP2: "This day marks not just a celebration of love, but the beginning of a <fc>lifetime</fc> filled with new dreams, new chapters, and endless moments together.",
    chanceP3: "We're so grateful for the love and support of our family and friends who have been part of <fc>our story</fc> from the start.",
    chanceP4: "Your <fc>presence</fc> means the world to us, and we can't wait to celebrate this special day surrounded by those <fc>we love most</fc>.",
    
    // Events
    events: [
      { time: "7:00 AM", title: "Bride's Tea Ceremony" },
      { time: "10:00 AM", title: "Groom's Tea Ceremony" },
      { time: "1:00 PM", title: "Lunch/Travel & Rest" },
      { time: "6:00 PM", title: "Guest Reception" },
      { time: "7:00 PM", title: "Wedding Ceremony" },
    ],
  },
  vi: {
    // Initial page
    openMe: "Open Me!",
    selectLanguage: "Chọn ngôn ngữ",
    vietnamese: "Tiếng Việt",
    english: "Tiếng Anh",
    
    // TopNav
    home: "Trang chủ",
    gallery: "Thư viện ảnh",
    rsvp: "Xác nhận tham dự",
    timeline: "Lịch trình",
    
    // Gallery
    galleryEyebrow: "Những khoảnh khắc",
    galleryTitle: "Thư viện ảnh tiền hôn lễ",
    galleryEmpty: "Ảnh sẽ được cập nhật sớm.",
    galleryEmptyLiked: "Chưa có ảnh được thích trong album này.",
    galleryShowAll: "Tất cả ảnh",
    galleryCategoryLabels: {
      "pre-wedding": "Pre-Wedding",
      "phong-su": "Hình Phóng Sự",
      "truyen-thong": "Hình Truyền thống",
      photobooth: "Photobooth",
      "guest-moments": "Khoảnh khắc từ khách mời",
    },
    guestMomentsUploadTitle: "Upload khoảnh khắc từ bạn",
    guestMomentsUploadHint: "Ảnh mọi kích thước · Video tối đa 30 giây",
    galleryPhotoboothSubLabels: {
      photobooth: "Photobooth",
      single: "Single",
    },
    galleryCategoryTitles: {
      "pre-wedding": "Pre-wedding",
      "phong-su": "Hình Phóng Sự",
      "truyen-thong": "Hình truyền thống",
      photobooth: "Photobooth",
    },
    
    // Schedule
    scheduleEyebrow: "Chuỗi sự kiện",
    scheduleHeading: "Lịch trình ngày cưới",
    scheduleDate: "30 tháng 5, 2026",
    addToCalendar: "Thêm vào lịch",
    calendarModalTitle: "Thêm vào lịch",
    
    // Formal Invitation
    formalInvitationText: "Thiệp mời chính thức sẽ được gửi sau.",
    formalInvitationDate: "30.05.2026",
    
    // Location
    location: "Địa Điểm",
    locationVenueName: "MAI HOUSE SAIGON HOTEL",
    locationAddress: "157 Nam Kỳ Khởi Nghĩa, Phường Xuân Hòa, Thành phố Hồ Chí Minh",
    locationTime: "Từ 18:00 đến 22:00",
    openInMaps: "Mở bản đồ",

    
    // Album (replaces RSVP CTA on home)
    albumMessage: "Xem thêm ảnh cưới của Bảo và Hậu tại đây.",
    albumButton: "Xem Album Ảnh",
    seeAlbum: "Xem Album Ảnh",
    
    // RSVP (legacy — page hidden)
    rsvpMessage: "Để gia đình chúng tôi có thể chuẩn bị tiệc cưới được chu toàn, kính mong Quý khách vui lòng phúc đáp.",
    rsvpButton: "Phúc Đáp",
    rsvpTitle: "Phúc Đáp",
    rsvpSubtitle: "Hẹn gặp bạn trong ngày vui của chúng tôi. Vui lòng phản hồi qua form bên dưới.",
    weddingTitle: "Bảo & Hậu's Wedding",
    findYourName: "Tìm tên của bạn",
    required: "(bắt buộc)",
    namePlaceholder: "Nhập tên như trên thiệp mời...",
    willAttend: "Bạn có tham dự không?",
    yes: "Có",
    no: "Không",
    numberOfGuests: "Số lượng khách",
    selectGuests: "Chọn số lượng khách",
    other: "Khác",
    enterGuests: "Nhập số lượng khách",
    guestNames: "Tên người thân đi cùng bạn",
    dietaryPreference: "Bạn có ăn chay không?",
    vegetarian: "Ăn chay",
    nonVegetarian: "Ăn Mặn",
    questionsComments: "Câu hỏi hoặc lời nhắn",
    submit: "Gửi",
    submitting: "Đang gửi...",
    submitSuccess: "Cảm ơn bạn! Đã gửi xác nhận tham dự thành công.",
    submitError: "Xin lỗi, đã có lỗi xảy ra khi gửi xác nhận. Vui lòng thử lại.",
    
    // ChanceEncounter
    chanceTitle: "Kết duyên",
    chanceP1: "Và rồi, sau những <fc>năm tháng</fc> đồng hành cùng nhau, tiếng cười, những chuyến đi và vô vàn kỷ niệm đáng nhớ, chúng tôi đã sẵn sàng bước sang một chặng đường mới trong hành trình của mình.",
    chanceP2: "Ngày hôm nay không chỉ là minh chứng cho tình yêu, mà còn là khởi đầu của một <fc>trang mới</fc> — nơi có những ước mơ và những ngày tháng hạnh phúc được viết tiếp bên nhau.",
    chanceP3: "Chúng tôi xin gửi lời biết ơn chân thành đến gia đình và bạn bè, những người đã luôn yêu thương, đồng hành và trở thành một phần ý nghĩa trong hành trình của chúng tôi ngay từ những ngày đầu.",
    chanceP4: "<fc>Sự hiện diện</fc> của bạn trong ngày vui hôm nay là món quà vô cùng quý giá đối với chúng tôi. Chúng tôi rất mong được cùng bạn sẻ chia và lưu giữ niềm hạnh phúc trọn vẹn này.",
    
    // Events
    events: [
      { time: "7:00 Sáng", title: "Lễ xin dâu" },
      { time: "10:00 SA", title: "Lễ xin rể" },
      { time: "1:00 CH – 4:00 CH", title: "Bữa trưa/Di chuyển & Nghỉ ngơi" },
      { time: "6:00 CH", title: "Đón khách" },
      { time: "7:00 CH", title: "Lễ thành hôn" },
    ],
    
    // Merge custom translations (nếu có) - override các key mặc định
    ...customVietnameseTranslations,
  }
};


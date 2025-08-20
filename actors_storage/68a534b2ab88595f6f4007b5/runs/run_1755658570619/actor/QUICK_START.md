# 🚀 Quick Start Guide

Hướng dẫn nhanh để sử dụng Google Search Scraper.

## 📋 Yêu cầu

- Node.js (v14+)
- npm hoặc yarn

## ⚡ Cài đặt nhanh

```bash
# Clone hoặc download project
cd google-search-craw

# Cài đặt dependencies
npm install
```

## 🎯 Sử dụng ngay

### Cách 1: URL trực tiếp (Khuyến nghị)

```bash
# Cào 10 kết quả từ Google search về "gach"
node src/main-puppeteer-url.js "https://www.google.com/search?q=gach&hl=vi&gl=vn&num=100" 10

# Cào 5 kết quả từ URL khác
node src/main-puppeteer-url.js "YOUR_URL_HERE" 5

# Cào tất cả kết quả (mặc định 10)
node src/main-puppeteer-url.js "https://www.google.com/search?q=javascript"
```

### Cách 2: Npm scripts

```bash
# Chạy với URL mặc định
npm start

# Chạy với nodemon (development)
npm run dev
```

## 📊 Kết quả

- **File output**: `output-puppeteer-url.json`
- **Format**: JSON với thông tin chi tiết về link, title, snippet
- **Số lượng**: Theo tham số bạn chỉ định

## 🎯 Ví dụ thực tế

```bash
# Cào kết quả tìm kiếm về "gach"
node src/main-puppeteer-url.js "https://www.google.com/search?q=gach&hl=vi&gl=vn&num=100" 10
```

Kết quả sẽ được lưu vào `output-puppeteer-url.json` với format:

```json
[
  {
    "position": 1,
    "link": {
      "title": "Gạch ốp Lát Giá Rẻ Chính Hãng Tốt Nhất...",
      "url": "https://gachtot.vn/gach/",
      "classes": "zReHs",
      "jsname": "UWckNb"
    },
    "snippet": "Gạch ốp lát Hoàng Mai - 66 Lạc Trung, Hà Nội...",
    "sourceUrl": "https://www.google.com/search?q=gach...",
    "scrapedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## 🔧 Troubleshooting

### Nếu không tìm thấy kết quả:
- Kiểm tra URL có đúng không
- Thử với URL Google search khác
- Kiểm tra file `debug-puppeteer-url.json` để debug

### Nếu có lỗi:
- Kiểm tra file `error-puppeteer-url.json`
- Đảm bảo đã cài đặt đầy đủ dependencies
- Thử chạy lại với delay lớn hơn

## 📁 Cấu trúc file

```
google-search-craw/
├── src/main-puppeteer-url.js    # Script chính
├── output-puppeteer-url.json    # Kết quả
├── package.json                 # Dependencies
└── README.md                    # Tài liệu chi tiết
```

## ⚡ Tips

- Sử dụng URL Google search đầy đủ để có kết quả tốt nhất
- Thêm tham số `num=100` để lấy nhiều kết quả hơn
- Sử dụng `hl=vi&gl=vn` cho kết quả tiếng Việt
- Kết quả được lưu tự động, không cần lo lắng về việc mất dữ liệu

---

**🎉 Bạn đã sẵn sàng cào dữ liệu Google search!**

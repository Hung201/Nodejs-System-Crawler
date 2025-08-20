# Google Search Scraper

Một công cụ cào dữ liệu Google search sử dụng Puppeteer và Cheerio để trích xuất các link từ kết quả tìm kiếm.

## ✨ Tính năng

- 🕷️ **Cào dữ liệu Google search** với Puppeteer để render JavaScript
- 🎯 **Trích xuất thẻ `<a>` class `zReHs`** - các link kết quả tìm kiếm chính
- 📝 **Lấy snippet** mô tả cho mỗi kết quả
- 🔧 **Tự động fallback** với các selector thay thế
- 📊 **Xuất kết quả JSON** với thông tin chi tiết
- ⚡ **Hỗ trợ URL trực tiếp** từ command line

## 🚀 Cài đặt

```bash
npm install
```

## 📖 Cách sử dụng

### 1. Cào từ URL trực tiếp (Khuyến nghị)

```bash
# Cào 10 kết quả từ Google search
node src/main-puppeteer-url.js "https://www.google.com/search?q=gach&hl=vi&gl=vn&num=100" 10

# Cào 5 kết quả từ URL khác
node src/main-puppeteer-url.js "YOUR_URL_HERE" 5

# Cào tất cả kết quả (mặc định 10)
node src/main-puppeteer-url.js "https://www.google.com/search?q=javascript"
```

### 2. Sử dụng npm scripts

```bash
# Chạy với URL mặc định
npm start

# Chạy với nodemon (development)
npm run dev
```

## 📁 Cấu trúc dự án

```
google-search-craw/
├── src/
│   └── main-puppeteer-url.js    # Script chính - cào với Puppeteer
├── input.json                   # Cấu hình input (không cần thiết khi dùng URL trực tiếp)
├── output-puppeteer-url.json    # Kết quả cào dữ liệu
├── package.json                 # Dependencies và scripts
├── README.md                    # Tài liệu này
└── QUICK_START.md              # Hướng dẫn nhanh
```

## 📊 Định dạng kết quả

Kết quả được lưu trong file `output-puppeteer-url.json`:

```json
[
  {
    "position": 1,
    "link": {
      "title": "Tiêu đề kết quả",
      "url": "https://example.com",
      "originalHref": "href gốc từ Google",
      "classes": "zReHs",
      "jsname": "UWckNb",
      "dataVed": "data-ved attribute",
      "ping": "ping attribute"
    },
    "snippet": "Mô tả ngắn về kết quả...",
    "sourceUrl": "URL nguồn Google search",
    "scrapedAt": "2024-01-01T00:00:00.000Z",
    "linkIndex": 1
  }
]
```

## 🎯 CSS Selectors

Script sử dụng các selector sau để tìm link:

1. **Primary**: `a.zReHs` - Link kết quả chính
2. **Fallback**: 
   - `a[class*="zReHs"]`
   - `a[jsname="UWckNb"]`
   - `a[href^="http"]`
   - `div.MjjYud a`
   - `div.g a`
   - `h3 a`
   - `.LC20lb`

## ⚙️ Cấu hình

### Headers và User-Agent
- User-Agent: Chrome 120.0.0.0
- Accept-Language: vi-VN,vi;q=0.9,en;q=0.8
- Các header browser-like khác

### Puppeteer Settings
- Headless mode: `true`
- Viewport: 1920x1080
- Timeout: 30 giây
- Wait strategy: `networkidle2`

## 🛠️ Xử lý lỗi

- **Debug info**: Lưu vào `debug-puppeteer-url.json`
- **Error info**: Lưu vào `error-puppeteer-url.json`
- **Retry logic**: Tự động thử lại nếu thất bại
- **Alternative selectors**: Tự động chuyển sang selector khác nếu không tìm thấy

## 📝 Ví dụ sử dụng

```bash
# Cào kết quả tìm kiếm về "gach"
node src/main-puppeteer-url.js "https://www.google.com/search?q=gach&hl=vi&gl=vn&num=100" 10

# Kết quả sẽ được lưu vào output-puppeteer-url.json
```

## 🔧 Tùy chỉnh

Bạn có thể chỉnh sửa các tham số trong `src/main-puppeteer-url.js`:

- `maxResults`: Số lượng kết quả tối đa
- `timeout`: Thời gian chờ
- `alternativeSelectors`: Danh sách selector thay thế
- Headers và User-Agent

## 📄 License

MIT License


"gạch lát nền phòng khách",
        "gạch lát nền nhà vệ sinh",
        "gạch lát nền nhà bếp",
        "gạch lát nền đẹp 2025",
        "gạch lát nền chống trơn",
        "gạch lát nền 60x60",
        "gạch lát nền 80x80",
        "gạch lát nền giá dưới 100k",
        "gạch lát nền ceramic",
        "gạch ốp tường phòng khách",
        "gạch ốp tường phòng ngủ",
        "gạch ốp tường nhà tắm",
        "gạch ốp tường 30x60",
        "gạch ốp tường 40x80",
        "gạch ốp tường cao cấp",
        "gạch ốp tường giả đá",
        "gạch ốp tường đẹp hiện đại",
        "gạch ốp tường nhà phố",
        "gạch ốp tường chống thấm",
        "gạch trang trí mặt tiền",
        "gạch trang trí phòng khách",
        "gạch trang trí nhà tắm",
        "gạch trang trí cổ điển",
        "gạch trang trí nghệ thuật",
        "gạch trang trí 3d",
        "gạch trang trí quán cafe",
        "gạch trang trí giả cổ",
        "gạch trang trí lục giác",
        "gạch trang trí terrazzo",
        "gạch giả gỗ ngoài trời",
        "gạch giả đá marble",
        "gạch vân đá cao cấp",
        "gạch mosaic hồ bơi",
        "gạch bông trang trí 20x20",
        "gạch terrazzo nhập khẩu",
        "gạch bóng kiếng toàn phần",
        "gạch granite lát nền",
        "gạch ốp lát phong cách Nhật",
        "gạch vintage decor",
        "gạch ốp lát nhập khẩu Ấn Độ",
        "gạch ốp lát nhập khẩu Trung Quốc",
        "gạch xây dựng thông minh",
        "gạch tiết kiệm năng lượng",
        "gạch tái chế bảo vệ môi trường",
        "xu hướng gạch trang trí 2025",
        "bảng giá gạch ốp lát mới nhất",
        "công ty cung cấp gạch trang trí",
        "đại lý gạch ốp lát tại Hà Nội",
        "gạch ốp lát Daisan",
        "Gạch Đại Sàn",
        "kho gạch Đại Sàn",
        "Daisantiles",
        "Daisanhouse",
        "Daisan depot",
        "Daisandepot",
        "Homepro Home pro",
        "Daisanstore",
        "Daisan Store",
        "Daisan ads",
        "Daisantech",
        "Daisan tìm kiếm",
        "Chuỗi VLXD Daisan",
        "Chuỗi Đại Sàn",
        "Hệ thống kho gạch Đại Sàn",
        "Mosaic Đại Sàn",
        "Mẫu gạch Đại Sàn",
        "Gạch bông Đại Sàn",
        "Gạch thẻ Đại Sàn",
        "Gạch terrazoo Đại Sàn",
        "Gạch ốp tường Đại Sàn",
        "Gạch lát nền Đại Sàn",
        "Gạch ngoại thất Đại Sàn",
        "Gạch hồ bơi Đại Sàn",
        "Gạch nhập khẩu Đại Sàn",
        "Gạch phân phối Đại Sàn",
        "Tổng kho gạch giá rẻ Đại Sàn",
        "Tổng kho trang trí Đại Sàn",
        "Vật liệu mới Đại Sàn",
        "Hot trend Đại Sàn",
        "Mẫu mới Đại Sàn",
        "Gạch thanh lý Đại Sàn",
        "Gạch giá rẻ tại kho Đại Sàn",
        "Vua gạch rẻ Đại Sàn",
        "Hệ thống cửa hàng gạch Đại Sàn",
        "Gian hàng online VLXD",
        "Baner quảng cáo",
        "VLXD giá rẻ Đại Sàn",
        "Tổng kho VLXD",
        "Tổng kho keo dán gạch",
        "Tổng kho keo xây dựng"
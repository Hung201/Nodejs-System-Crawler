# Multi-Website Product Crawler

Crawler đa năng để crawl sản phẩm từ các website khác nhau với cấu hình linh hoạt.

## Tính năng

- **Crawl tự động**: Tự động phát hiện và crawl link sản phẩm
- **Cấu hình linh hoạt**: Hỗ trợ nhiều selector và pattern khác nhau
- **Xử lý ảnh thông minh**: Tự động lọc và tải ảnh sản phẩm
- **Tạo SKU tự động**: Tự động tạo SKU cho sản phẩm
- **Lưu dữ liệu**: Xuất dữ liệu ra file JSON
- **Hai chế độ crawl**: Direct crawl và API crawl với recursive discovery

## Cài đặt

```bash
npm install
```

## Sử dụng

### 1. Cấu hình input.json

Tạo file `input.json` với cấu hình sau:

```json
{
    "url": "https://example.com/products",
    "pageStart": 1,
    "pageEnd": 5,
    "productLinkSelector": ".product-item a",
    "productLinkIncludePatterns": ["product"],
    "productLinkExcludePatterns": ["about", "contact"],
    "titleClass": "h1, .product-title",
    "descriptionClass": ".product-description",
    "priceClass": ".product-price",
    "skuClass": ".product-sku",
    "contentClass": ".product-content",
    "thumbnailClass": ".product-thumbnail img",
    "imagesClass": ".product-gallery img",
    "autoGenerateSku": true,
    "websiteName": "EXAMPLE",
    "isPrice": false,
    "isThumbnail": false,
    "supplier": "Example Supplier",
    "url_supplier": "https://example.com",
    "isBrowser": false,
    "maxProductLinks": 50
}
```

### 2. Chạy crawler

```bash
npm start
```

## Chế độ Crawl (isBrowser)

Crawler hỗ trợ 2 chế độ crawl khác nhau thông qua biến `isBrowser`:

### 🔍 **isBrowser: false (Direct Crawl)**
- **Cách hoạt động**: Crawl trực tiếp HTML từ website
- **Quy trình**:
  1. Truy cập URL đầu tiên
  2. Parse HTML và tìm link sản phẩm theo `productLinkSelector`
  3. Lọc link theo `productLinkIncludePatterns` và `productLinkExcludePatterns`
  4. Tạo URL phân trang (nếu có `paginationPattern`)
  5. Crawl chi tiết từng sản phẩm
- **Ưu điểm**: Nhanh, ít phụ thuộc bên ngoài
- **Nhược điểm**: Có thể bị chặn bởi anti-bot

### 🌐 **isBrowser: true (API Crawl)**
- **Cách hoạt động**: Sử dụng API external để crawl recursive
- **Quy trình**:
  1. **Bước 1**: Gọi API `http://api-product.daisan.vn/?mod=parseurl&site=_db` với URL đầu tiên
  2. **Bước 2**: Lấy **TẤT CẢ** `a_links` từ API (không lọc)
  3. **Bước 3**: Với mỗi link trong `a_links`:
     - Gọi lại API với link đó
     - Lọc link sản phẩm theo `productLinkIncludePatterns` và `productLinkExcludePatterns`
     - Thu thập link sản phẩm cho đến khi đạt `maxProductLinks`
  4. **Bước 4**: Crawl chi tiết từng sản phẩm
- **Ưu điểm**: Khám phá sâu hơn, ít bị chặn
- **Nhược điểm**: Chậm hơn, phụ thuộc API external

### 📊 **Ví dụ quy trình API Crawl:**
```
URL đầu tiên → API → [link1, link2, link3, link4, link5]
├── link1 → API → [san-pham-1.html, san-pham-2.html] ✅
├── link2 → API → [gioi-thieu, tin-tuc] ❌
├── link3 → API → [san-pham-3.html, san-pham-4.html] ✅
├── link4 → API → [lien-he, about] ❌
└── link5 → API → [san-pham-5.html, san-pham-6.html] ✅
```

### ⚙️ **Cấu hình cho từng chế độ:**

#### Direct Crawl (isBrowser: false)
```json
{
    "isBrowser": false,
    "url": "https://example.com/products",
    "productLinkSelector": ".product-item a",
    "productLinkIncludePatterns": ["product"],
    "productLinkExcludePatterns": ["about", "contact"],
    "paginationPattern": "?page=",
    "pageStart": 1,
    "pageEnd": 5
}
```

#### API Crawl (isBrowser: true)
```json
{
    "isBrowser": true,
    "url": "https://example.com/products",
    "productLinkIncludePatterns": ["san-pham", ".html"],
    "productLinkExcludePatterns": ["gioi-thieu", "tin-tuc"],
    "maxProductLinks": 50
}
```

## Cấu hình chi tiết

### URL và phân trang
- `url`: URL bắt đầu crawl
- `pageStart`: Trang bắt đầu (thay thế maxPages)
- `pageEnd`: Trang kết thúc (thay thế maxPages)
- `paginationPattern`: Pattern phân trang (tùy chọn)
- `isBrowser`: Chế độ crawl (true = API, false = Direct)
- `maxProductLinks`: Số link sản phẩm tối đa (cho API crawl)

### Selector sản phẩm
- `productLinkSelector`: Selector cho link sản phẩm
- `productLinkIncludePatterns`: Pattern bắt buộc có trong URL sản phẩm
- `productLinkExcludePatterns`: Pattern loại bỏ khỏi URL sản phẩm

### Selector dữ liệu
- `titleClass`: Selector cho tiêu đề sản phẩm
- `descriptionClass`: Selector cho mô tả
- `priceClass`: Selector cho giá
- `skuClass`: Selector cho SKU
- `contentClass`: Selector cho nội dung HTML
- `thumbnailClass`: Selector cho ảnh thumbnail
- `imagesClass`: Selector cho ảnh sản phẩm

### Tùy chọn khác
- `autoGenerateSku`: Tự động tạo SKU nếu không có
- `websiteName`: Tên website (dùng cho SKU)
- `isPrice`: Bỏ qua sản phẩm không có giá nếu true
- `isThumbnail`: Bỏ qua sản phẩm không có thumbnail nếu true
- `supplier`: Tên nhà cung cấp
- `url_supplier`: URL nhà cung cấp

### Lọc ảnh
- `includePatterns`: Pattern ảnh cần lấy
- `excludePatterns`: Pattern ảnh cần loại bỏ
- `skuInImage`: Chỉ lấy ảnh chứa SKU

## Kết quả

Dữ liệu được lưu vào file `hung.json` với format:

```json
[
    {
        "url": "https://example.com/product/1",
        "title": "Tên sản phẩm",
        "description": "Mô tả sản phẩm",
        "price": "100000",
        "sku": "EXAMPLE_PROD_123",
        "thumbnail": "https://example.com/thumb.jpg",
        "images": ["https://example.com/img1.jpg"],
        "content": "<div>Nội dung HTML</div>",
        "supplier": "Example Supplier",
        "url_supplier": "https://example.com"
    }
]
```

## Ví dụ cấu hình cho các website phổ biến

### Daisan.vn (Direct Crawl)
```json
{
    "url": "https://b2b.daisan.vn/products/gach-op-tuong",
    "pageStart": 1,
    "pageEnd": 5,
    "paginationPattern": "?page=",
    "productLinkSelector": ".list-item-img a",
    "productLinkIncludePatterns": ["gach-"],
    "productLinkExcludePatterns": ["gioi-thieu", "tin-tuc"],
    "titleClass": ".product-detail_title h1",
    "descriptionClass": ".product-attribute",
    "priceClass": ".price",
    "autoGenerateSku": true,
    "websiteName": "DAISANB2B",
    "isPrice": true,
    "isThumbnail": true,
    "isBrowser": false
}
```

### LecaoPhatTiles.vn (API Crawl)
```json
{
    "url": "http://lecaophattiles.vn/san-pham/ecom-821-506.html",
    "productLinkSelector": ".item a",
    "productLinkIncludePatterns": ["san-pham", ".html"],
    "productLinkExcludePatterns": ["gioi-thieu", "tin-tuc"],
    "titleClass": ".ten",
    "descriptionClass": "#content_tabs",
    "priceClass": ".price",
    "autoGenerateSku": true,
    "websiteName": "DAISANB2B",
    "isPrice": false,
    "isThumbnail": false,
    "isBrowser": true,
    "maxProductLinks": 50
}
```

## Lưu ý

- Crawler sử dụng CheerioCrawler cho hiệu suất tốt
- Tự động giới hạn 200 link sản phẩm mỗi trang để tránh quá tải
- Hỗ trợ fallback selector nếu selector chính không tìm thấy
- Tự động tạo URL tuyệt đối cho ảnh
- Lọc ảnh thông minh để loại bỏ ảnh không phải sản phẩm
- **API Crawl**: Có delay 1 giây giữa các request để tránh spam API
- **Direct Crawl**: Hỗ trợ phân trang với `pageStart` và `pageEnd`
- **SKU Generation**: Tự động tạo SKU 6 số nếu không tìm thấy SKU trên trang

//DAISANB2B

{
    "url": "https://b2b.daisan.vn/products/gach-op-tuong",
    "paginationPattern": "?page=",
    "pageStart": 1,
    "pageEnd": 5,
    "productLinkSelector": ".list-item-img a",
    "productLinkIncludePatterns": [
        "gach-"
    ],
    "productLinkExcludePatterns": [
        "gioi-thieu",
        "tin-tuc",
        "du-an",
        "lien-he",
        "about",
        "news",
        "contact",
        "p="
    ],
    "titleClass": ".product-detail_title h1",
    "descriptionClass": ".product-attribute",
    "priceClass": ".price",
    "skuClass": "",
    "contentClass": ".description-info",
    "thumbnailClass": ".image-slider-item img",
    "imagesClass": ".thumb-slider .swiper-container .swiper-wrapper .swiper-slide",
    "includePatterns": [],
    "excludePatterns": [
        "thumb",
        "small",
        "icon",
        "logo"
    ],
    "skuInImage": false,
    "autoGenerateSku": true,
    "websiteName": "DAISANB2B",
    "isPrice": true,
    "isThumbnail": true,
    "supplier": "DAISANB2B",
    "url_supplier": "https://b2b.daisan.vn",
    "maxRequestsPerCrawl": 50000,
    "maxProductLinks": 50,
    "isBrowser": false
}




{
    "url": "http://lecaophattiles.vn/san-pham/ecom-821-506.html",
    "paginationPattern": "",
    "pageStart": 6,
    "pageEnd": 15,
    "productLinkSelector": ".item a",
    "productLinkIncludePatterns": [
        "san-pham",
        ".html"
    ],
    "productLinkExcludePatterns": [
        "gioi-thieu",
        "tin-tuc",
        "du-an",
        "lien-he",
        "about",
        "news",
        "contact",
        "p="
    ],
    "titleClass": ".ten",
    "descriptionClass": "#content_tabs",
    "priceClass": ".price",
    "skuClass": "",
    "contentClass": ".description-info",
    "thumbnailClass": ".image-slider-item img",
    "imagesClass": ".thumb-slider .swiper-container .swiper-wrapper .swiper-slide",
    "includePatterns": [],
    "excludePatterns": [
        "thumb",
        "small",
        "icon",
        "logo"
    ],
    "skuInImage": false,
    "autoGenerateSku": true,
    "websiteName": "DAISANB2B",
    "isPrice": false,
    "isThumbnail": false,
    "supplier": "DAISANB2B",
    "url_supplier": "https://b2b.daisan.vn",
    "maxRequestsPerCrawl": 50000,
    "maxProductLinks": 50,
    "isBrowser": true
}
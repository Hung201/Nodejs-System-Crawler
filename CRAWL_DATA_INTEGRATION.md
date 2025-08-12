# Tích hợp lưu dữ liệu crawl vào database

## Tổng quan

Hệ thống đã được tích hợp để tự động lưu dữ liệu sản phẩm từ output của campaign vào bảng `crawldatas` trong MongoDB.

## Các thay đổi đã thực hiện

### 1. Cập nhật CampaignService

File: `services/campaignService.js`

- ✅ Import `crawlDataService`
- ✅ Tích hợp logic lưu dữ liệu vào database khi campaign hoàn thành
- ✅ Xử lý lỗi khi lưu database không ảnh hưởng đến campaign completion

### 2. Cấu trúc dữ liệu

Model: `models/CrawlData.js`

Dữ liệu sản phẩm được lưu với cấu trúc:
```javascript
{
  title: "Tên sản phẩm",
  description: "Mô tả sản phẩm", 
  content: "Nội dung HTML",
  type: "product",
  url: "URL sản phẩm",
  source: "Tên supplier",
  sourceUrl: "URL supplier",
  thumbnail: "URL ảnh thumbnail",
  images: ["URL ảnh 1", "URL ảnh 2"],
  metadata: {
    price: "Giá sản phẩm",
    sku: "Mã SKU",
    category: "Danh mục",
    supplier: "Tên supplier"
  },
  campaignId: "ID campaign",
  actorId: "ID actor",
  status: "pending" // pending, approved, rejected, translated
}
```

## API Endpoints có sẵn

### 1. Lấy tất cả dữ liệu crawl
```
GET /api/crawl-data
Query params: page, limit, type, status, campaignId, actorId, source
```

### 2. Lấy dữ liệu theo campaign
```
GET /api/crawl-data/campaign/:campaignId
Query params: type, status
```

### 3. Lấy dữ liệu theo loại
```
GET /api/crawl-data/type/:type
Query params: status, campaignId, actorId
```

### 4. Lấy dữ liệu theo ID
```
GET /api/crawl-data/:id
```

### 5. Lấy thống kê
```
GET /api/crawl-data/stats
Query params: campaignId, actorId
```

### 6. Cập nhật trạng thái
```
PUT /api/crawl-data/:id/status
Body: { status, notes }
```

### 7. Xóa dữ liệu theo campaign
```
DELETE /api/crawl-data/campaign/:campaignId
```

## Scripts test

### 1. Test lưu dữ liệu
```bash
node test-save-crawl-data.js
```

### 2. Kiểm tra dữ liệu campaign
```bash
node check-campaign-data.js
```

### 3. Test API endpoints
```bash
node test-crawl-data-api.js
```

## Quy trình hoạt động

1. **Campaign chạy** → Actor crawl dữ liệu
2. **Actor lưu output** → File `hung.json` 
3. **CampaignService đọc output** → Parse JSON data
4. **Lưu vào database** → Bảng `crawldatas`
5. **Cập nhật campaign** → Thêm `savedDataCount`

## Log messages

Khi campaign chạy, bạn sẽ thấy các log:

```
💾 Bắt đầu lưu 70 sản phẩm vào database...
✅ Đã lưu thành công 70 sản phẩm vào database
```

## Xử lý lỗi

- Nếu lưu database thất bại, campaign vẫn hoàn thành thành công
- Lỗi database được log nhưng không ảnh hưởng đến campaign status
- Dữ liệu vẫn được lưu trong `campaign.result.output`

## Kiểm tra dữ liệu

### 1. Trong MongoDB Compass
- Database: `system_crawler`
- Collection: `crawldatas`
- Filter: `{ campaignId: "YOUR_CAMPAIGN_ID" }`

### 2. Qua API
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/crawl-data/campaign/YOUR_CAMPAIGN_ID
```

### 3. Qua script
```bash
node check-campaign-data.js
```

## Lưu ý

- Tất cả API endpoints yêu cầu authentication
- Dữ liệu được lưu với status mặc định là `pending`
- Có thể cập nhật status thành `approved`, `rejected`, `translated`
- Metadata chứa thông tin chi tiết theo loại dữ liệu
- Indexes đã được tạo để tối ưu query performance

## Troubleshooting

### 1. Không thấy dữ liệu trong database
- Kiểm tra campaign có output không
- Kiểm tra log lỗi database
- Chạy `check-campaign-data.js` để debug

### 2. API trả về lỗi authentication
- Kiểm tra JWT token
- Đảm bảo token chưa hết hạn
- Kiểm tra user có quyền truy cập

### 3. Campaign không lưu được dữ liệu
- Kiểm tra kết nối MongoDB
- Kiểm tra schema validation
- Xem log lỗi trong campaign result

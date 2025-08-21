# 🎯 HƯỚNG DẪN TẠO CAMPAIGN VỚI ACTOR VÀ INPUT KHÁC

## 📋 Tổng quan

Campaign cho phép bạn chạy actor với các input khác nhau mà không cần tạo actor mới. Đây là cách hiệu quả để tái sử dụng actor với các tham số khác nhau.

## 🚀 Quy trình tạo Campaign

### Bước 1: Tạo Campaign

**API Endpoint:** `POST /api/campaigns`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
    "name": "Tên Campaign",
    "description": "Mô tả campaign",
    "actorId": "ID_CỦA_ACTOR",
    "input": {
        "searchTerms": ["từ khóa 1", "từ khóa 2", "từ khóa 3"],
        "maxRequests": 3
    },
    "config": {
        "timeout": 300000,
        "maxRetries": 3
    }
}
```

### Bước 2: Chạy Campaign

**API Endpoint:** `POST /api/campaigns/{campaignId}/run`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (tùy chọn - custom input):**
```json
{
    "input": {
        "searchTerms": ["từ khóa tùy chỉnh"],
        "maxRequests": 5
    }
}
```

### Bước 3: Kiểm tra trạng thái

**API Endpoint:** `GET /api/campaigns/{campaignId}/status`

### Bước 4: Xem kết quả

**API Endpoint:** `GET /api/campaigns/{campaignId}`

## 📊 Ví dụ thực tế

### Ví dụ 1: Campaign với từ khóa khác

```javascript
// Tạo campaign
const createResponse = await axios.post('http://localhost:5000/api/campaigns', {
    name: "Campaign Gạch Ốp Lát - Lần 2",
    description: "Chạy actor với từ khóa khác",
    actorId: "68a534b2ab88595f6f4007b5",
    input: {
        searchTerms: ["gạch ốp lát Ý", "gạch ốp lát Tây Ban Nha"],
        maxRequests: 3
    }
});

// Chạy campaign
const runResponse = await axios.post(`http://localhost:5000/api/campaigns/${campaignId}/run`);
```

### Ví dụ 2: Campaign với input tùy chỉnh khi chạy

```javascript
// Tạo campaign với input mặc định
const createResponse = await axios.post('http://localhost:5000/api/campaigns', {
    name: "Campaign Linh Hoạt",
    actorId: "68a534b2ab88595f6f4007b5",
    input: {
        searchTerms: ["gạch ốp lát"],
        maxRequests: 1
    }
});

// Chạy với input khác
const runResponse = await axios.post(`http://localhost:5000/api/campaigns/${campaignId}/run`, {
    input: {
        searchTerms: ["gạch ốp lát cao cấp", "gạch ốp lát nhập khẩu"],
        maxRequests: 5
    }
});
```

## 🔧 Các API Endpoints khác

### Xem tất cả campaigns
```
GET /api/campaigns
```

### Xem campaigns theo actor
```
GET /api/campaigns/actor/{actorId}
```

### Xem campaigns đang chạy
```
GET /api/campaigns/running/status
```

### Hủy campaign
```
POST /api/campaigns/{campaignId}/cancel
```

### Reset campaign
```
POST /api/campaigns/{campaignId}/reset
```

### Xóa campaign
```
DELETE /api/campaigns/{campaignId}
```

## 📈 Trạng thái Campaign

- **pending**: Chờ chạy
- **running**: Đang chạy
- **completed**: Hoàn thành
- **failed**: Thất bại
- **cancelled**: Đã hủy

## 🎯 Lợi ích của Campaign

1. **Tái sử dụng Actor**: Một actor có thể chạy nhiều campaign với input khác nhau
2. **Quản lý Input**: Mỗi campaign có input riêng biệt
3. **Theo dõi Kết quả**: Mỗi campaign có kết quả và logs riêng
4. **Lịch sử Chạy**: Lưu trữ lịch sử tất cả các lần chạy
5. **Thống kê**: Theo dõi hiệu suất và thành công rate

## 🚀 Scripts có sẵn

### 1. Tạo campaign đơn giản
```bash
node scripts/create-campaign-simple.js
```

### 2. Tạo campaign với simulation
```bash
node scripts/create-campaign-simulation.js
```

### 3. Hướng dẫn đầy đủ
```bash
node scripts/campaign-guide.js
```

### 4. Kiểm tra trạng thái
```bash
node scripts/check-campaign-status.js
```

### 5. Xem danh sách campaigns
```bash
node scripts/list-campaigns.js
```

## 📝 Lưu ý quan trọng

1. **Actor phải sẵn sàng**: Actor phải có status `ready` và build thành công
2. **Input hợp lệ**: Input phải phù hợp với schema của actor
3. **Timeout**: Mỗi campaign có timeout riêng (mặc định 5 phút)
4. **Concurrent Runs**: Có thể chạy nhiều campaign cùng lúc (giới hạn 3)
5. **Cleanup**: Hệ thống tự động cleanup processes sau khi hoàn thành

## 🔍 Troubleshooting

### Campaign bị failed
- Kiểm tra logs trong `campaign.result.error`
- Đảm bảo actor có đủ files cần thiết
- Kiểm tra input có hợp lệ không

### Campaign không hoàn thành
- Kiểm tra timeout settings
- Xem logs real-time trong server console
- Kiểm tra actor process có đang chạy không

### Không tìm thấy input.json
- Đảm bảo actor được import đúng cách
- Kiểm tra cấu trúc thư mục actor
- Sử dụng simulation mode nếu cần

## 🎯 Kết luận

Campaign system cho phép bạn tái sử dụng actor một cách hiệu quả với các input khác nhau. Đây là cách tốt nhất để quản lý và chạy nhiều task scraping với cùng một actor.

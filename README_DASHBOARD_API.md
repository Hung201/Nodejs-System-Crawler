# Dashboard API - Hướng dẫn sử dụng

## 🎯 Tổng quan

Dashboard API đã được tạo hoàn chỉnh với 5 endpoint chính để cung cấp dữ liệu cho dashboard của hệ thống crawl dữ liệu.

## 📁 Files đã tạo/cập nhật

1. **`controllers/dashboardController.js`** - Controller chứa logic xử lý
2. **`routes/dashboard.js`** - Routes đã được cập nhật với các endpoint
3. **`docs/DASHBOARD_API.md`** - Documentation chi tiết
4. **`scripts/test-dashboard-api.js`** - Script test API
5. **`README_DASHBOARD_API.md`** - File này

## 🚀 Các API Endpoints

### 1. Thống kê tổng quan
```
GET /api/dashboard/stats
```
Trả về:
- Tổng dữ liệu crawl
- Số nguồn crawl
- Số người dùng
- Số actor đang chạy
- Phần trăm thay đổi so với tháng trước

### 2. Dữ liệu biểu đồ
```
GET /api/dashboard/chart-data
```
Trả về dữ liệu 7 ngày qua để vẽ biểu đồ

### 3. Trạng thái dữ liệu
```
GET /api/dashboard/data-status
```
Trả về số lượng theo trạng thái: pending, translated, approved, rejected

### 4. Dữ liệu gần đây
```
GET /api/dashboard/recent-data?limit=10
```
Trả về danh sách dữ liệu mới nhất

### 5. Thống kê chi tiết
```
GET /api/dashboard/detailed-stats
```
Trả về phân tích theo loại, nguồn và thời gian

## 🔧 Cách sử dụng

### 1. Khởi động server
```bash
npm start
# hoặc
node server.js
```

### 2. Test API
```bash
# Cài đặt axios nếu chưa có
npm install axios

# Chạy test
node scripts/test-dashboard-api.js
```

### 3. Sử dụng trong frontend
```javascript
// Ví dụ với fetch API
const getDashboardStats = async () => {
  const response = await fetch('/api/dashboard/stats', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};
```

## 📊 Cấu trúc dữ liệu

### Response format chuẩn
```json
{
  "success": true,
  "data": {
    // Dữ liệu cụ thể
  }
}
```

### Error format
```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "error": "Chi tiết lỗi"
}
```

## 🔐 Authentication

Tất cả API đều yêu cầu Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

## 📈 Dữ liệu được tính toán

### Thống kê tổng quan
- **Tổng dữ liệu**: Đếm từ `CrawlData` collection
- **Nguồn crawl**: Đếm từ `Source` collection  
- **Người dùng**: Đếm từ `User` collection (status: 'active')
- **Actor đang chạy**: Đếm từ `Actor` collection (runInfo.runStatus: 'running')

### Biểu đồ 7 ngày
- Dữ liệu được nhóm theo ngày
- Tính từ 7 ngày trước đến hiện tại
- Format date: YYYY-MM-DD

### Trạng thái dữ liệu
- **pending**: Chờ xử lý
- **translated**: Đã dịch
- **approved**: Đã duyệt  
- **rejected**: Bị từ chối

## 🛠️ Tùy chỉnh

### Thêm endpoint mới
1. Thêm method trong `controllers/dashboardController.js`
2. Thêm route trong `routes/dashboard.js`
3. Cập nhật documentation

### Thay đổi logic tính toán
- Chỉnh sửa các method trong controller
- Có thể thêm cache để tối ưu performance

## 🧪 Testing

### Chạy test tự động
```bash
node scripts/test-dashboard-api.js
```

### Test thủ công với cURL
```bash
# Test stats
curl -X GET \
  http://localhost:3000/api/dashboard/stats \
  -H 'Authorization: Bearer your-token' \
  -H 'Content-Type: application/json'

# Test chart data
curl -X GET \
  http://localhost:3000/api/dashboard/chart-data \
  -H 'Authorization: Bearer your-token' \
  -H 'Content-Type: application/json'
```

## 📝 Lưu ý quan trọng

1. **Performance**: Các query aggregate có thể chậm với dữ liệu lớn
2. **Caching**: Nên implement cache cho các thống kê không thay đổi thường xuyên
3. **Indexing**: Đảm bảo có index cho các field thường query
4. **Error handling**: Tất cả API đều có try-catch và error logging

## 🔄 Cập nhật

Để cập nhật API:
1. Chỉnh sửa controller
2. Test với script
3. Cập nhật documentation
4. Deploy

## 📞 Hỗ trợ

Nếu có vấn đề:
1. Kiểm tra logs trong `logs/` directory
2. Chạy test script để debug
3. Kiểm tra database connection
4. Verify authentication token

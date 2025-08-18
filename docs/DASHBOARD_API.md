# Dashboard API Documentation

## Tổng quan
Dashboard API cung cấp các endpoint để lấy thống kê và dữ liệu cho dashboard của hệ thống crawl dữ liệu.

## Base URL
```
/api/dashboard
```

## Authentication
Tất cả các endpoint đều yêu cầu authentication. Sử dụng Bearer token trong header:
```
Authorization: Bearer <your-token>
```

## Endpoints

### 1. Lấy thống kê tổng quan
**GET** `/api/dashboard/stats`

Lấy thống kê tổng quan về hệ thống bao gồm tổng dữ liệu, nguồn crawl, người dùng và actor đang chạy.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalData": {
      "value": 1250,
      "change": "+12% so với tháng trước"
    },
    "totalSources": {
      "value": 15,
      "change": "+3 so với tháng trước"
    },
    "totalUsers": {
      "value": 8,
      "change": "+1 so với tháng trước"
    },
    "runningActors": {
      "value": 3,
      "change": "-2 so với tháng trước"
    }
  }
}
```

### 2. Lấy dữ liệu biểu đồ (7 ngày qua)
**GET** `/api/dashboard/chart-data`

Lấy dữ liệu để vẽ biểu đồ thống kê trong 7 ngày qua.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "count": 45
    },
    {
      "date": "2024-01-02", 
      "count": 67
    },
    // ... 7 ngày
  ]
}
```

### 3. Lấy trạng thái dữ liệu
**GET** `/api/dashboard/data-status`

Lấy số lượng dữ liệu theo từng trạng thái xử lý.

**Response:**
```json
{
  "success": true,
  "data": {
    "pending": 150,
    "translated": 89,
    "approved": 234,
    "rejected": 12
  }
}
```

### 4. Lấy dữ liệu gần đây
**GET** `/api/dashboard/recent-data`

Lấy danh sách dữ liệu mới nhất được crawl.

**Query Parameters:**
- `limit` (optional): Số lượng record trả về (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Sản phẩm mới",
      "description": "Mô tả sản phẩm",
      "type": "product",
      "source": "DAISANB2B",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "campaignId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Campaign A"
      },
      "actorId": {
        "_id": "507f1f77bcf86cd799439013", 
        "name": "Product Scraper"
      }
    }
  ]
}
```

### 5. Lấy thống kê chi tiết
**GET** `/api/dashboard/detailed-stats`

Lấy thống kê chi tiết bao gồm phân tích theo loại dữ liệu, nguồn và thời gian.

**Response:**
```json
{
  "success": true,
  "data": {
    "byType": [
      {
        "_id": "product",
        "count": 450
      },
      {
        "_id": "news",
        "count": 320
      }
    ],
    "bySource": [
      {
        "_id": "DAISANB2B",
        "count": 200
      },
      {
        "_id": "YouTube",
        "count": 150
      }
    ],
    "timeStats": {
      "last24h": 45,
      "last7Days": 320,
      "last30Days": 1250
    }
  }
}
```

## Error Responses

Tất cả các endpoint có thể trả về lỗi với format:

```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "error": "Chi tiết lỗi (nếu có)"
}
```

**HTTP Status Codes:**
- `200`: Thành công
- `401`: Unauthorized (thiếu hoặc token không hợp lệ)
- `500`: Internal Server Error

## Ví dụ sử dụng

### JavaScript (Fetch API)
```javascript
const getDashboardStats = async () => {
  try {
    const response = await fetch('/api/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  }
};
```

### cURL
```bash
curl -X GET \
  http://localhost:3000/api/dashboard/stats \
  -H 'Authorization: Bearer your-token-here' \
  -H 'Content-Type: application/json'
```

## Lưu ý

1. Tất cả thời gian được trả về theo định dạng ISO 8601
2. Số liệu thống kê được tính real-time từ database
3. Dữ liệu biểu đồ được tính theo múi giờ của server
4. Các endpoint có thể mất thời gian xử lý nếu có nhiều dữ liệu

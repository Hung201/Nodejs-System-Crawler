# Actor CRUD API Guide

## 🎯 Tổng quan
Hướng dẫn chi tiết sử dụng API CRUD (Create, Read, Update, Delete) cho Actor trong hệ thống.

## 📋 Danh sách API Endpoints

### **1. CREATE - Tạo Actor mới**
```http
POST /api/actors
```

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Body (Form Data):**
```
name: "My Web Scraper"                    // Bắt buộc
description: "Scrapes product data"       // Tùy chọn
type: "web-scraper"                       // Bắt buộc
category: "e-commerce"                    // Tùy chọn
visibility: "private"                     // Tùy chọn
tags: "web-scraping,products"             // Tùy chọn
config: {"maxConcurrency": 10}            // Tùy chọn (JSON string)
inputSchema: {"type": "object"}           // Tùy chọn (JSON string)
actorFile: [file]                         // Tùy chọn
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "_id": "64f1234567890abcdef",
    "name": "My Web Scraper",
    "description": "Scrapes product data",
    "type": "web-scraper",
    "status": "draft",
    "category": "e-commerce",
    "visibility": "private",
    "buildInfo": {
      "buildCount": 0,
      "buildStatus": "pending"
    },
    "runInfo": {
      "runCount": 0,
      "runStatus": "idle"
    },
    "createdAt": "2025-08-05T10:30:00.000Z"
  }
}
```

### **2. READ - Đọc danh sách Actor**
```http
GET /api/actors
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
?page=1                    // Trang hiện tại (default: 1)
?limit=10                  // Số actor/trang (default: 10)
?status=ready              // Lọc theo status
?type=web-scraper          // Lọc theo type
?category=e-commerce       // Lọc theo category
?visibility=public         // Lọc theo visibility
?buildStatus=success       // Lọc theo build status
?runStatus=idle            // Lọc theo run status
?search=scraper            // Tìm kiếm trong name, description, tags
```

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1234567890abcdef",
      "name": "My Web Scraper",
      "description": "Scrapes product data",
      "type": "web-scraper",
      "status": "ready",
      "category": "e-commerce",
      "visibility": "private",
      "buildInfo": {
        "buildCount": 1,
        "buildStatus": "success"
      },
      "runInfo": {
        "runCount": 0,
        "runStatus": "idle"
      },
      "createdBy": {
        "_id": "64f1234567890abcdef",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "createdAt": "2025-08-05T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### **3. READ - Đọc Actor theo ID**
```http
GET /api/actors/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64f1234567890abcdef",
    "name": "My Web Scraper",
    "description": "Scrapes product data",
    "type": "web-scraper",
    "status": "ready",
    "category": "e-commerce",
    "visibility": "private",
    "tags": ["web-scraping", "products"],
    "config": {
      "maxConcurrency": 10,
      "timeout": 30000,
      "retryAttempts": 3
    },
    "buildInfo": {
      "lastBuildAt": "2025-08-05T10:35:00.000Z",
      "buildCount": 1,
      "buildStatus": "success",
      "buildLog": "Build completed successfully"
    },
    "runInfo": {
      "lastRunAt": null,
      "runCount": 0,
      "runStatus": "idle"
    },
    "metrics": {
      "averageRunTime": 0,
      "successRate": 0,
      "totalDataProcessed": 0
    },
    "createdBy": {
      "_id": "64f1234567890abcdef",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2025-08-05T10:30:00.000Z",
    "updatedAt": "2025-08-05T10:35:00.000Z"
  }
}
```

### **4. UPDATE - Cập nhật Actor**
```http
PUT /api/actors/:id
```

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Updated Web Scraper",
  "description": "Updated description",
  "status": "ready",
  "category": "e-commerce",
  "visibility": "public",
  "tags": ["updated", "web-scraping"],
  "config": {
    "maxConcurrency": 15,
    "timeout": 45000
  }
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64f1234567890abcdef",
    "name": "Updated Web Scraper",
    "description": "Updated description",
    "status": "ready",
    "category": "e-commerce",
    "visibility": "public",
    "updatedBy": {
      "_id": "64f1234567890abcdef",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "updatedAt": "2025-08-05T10:40:00.000Z"
  }
}
```

### **5. DELETE - Xóa Actor**
```http
DELETE /api/actors/:id
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Actor đã được xóa thành công"
}
```

## 🔧 Các API bổ sung

### **6. Build Actor**
```http
POST /api/actors/:id/build
```

**Response:**
```json
{
  "success": true,
  "data": {
    "buildId": 1,
    "status": "building",
    "message": "Build process started"
  }
}
```

### **7. Run Actor**
```http
POST /api/actors/:id/run
```

**Body:**
```json
{
  "input": {
    "url": "https://example.com",
    "maxPages": 10,
    "productSelector": ".product-item"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "runId": "run_1733456789012",
    "status": "running",
    "message": "Actor execution started",
    "input": {
      "url": "https://example.com",
      "maxPages": 10
    }
  }
}
```

### **8. Get Actor Statistics**
```http
GET /api/actors/stats/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total": 25,
      "active": 15,
      "inactive": 5,
      "draft": 5
    },
    "byType": [
      {
        "_id": "web-scraper",
        "count": 12
      },
      {
        "_id": "product-scraper",
        "count": 8
      }
    ]
  }
}
```

## 📝 Ví dụ sử dụng với cURL

### **Tạo Actor mới:**
```bash
curl -X POST http://localhost:5000/api/actors \
  -H "Authorization: Bearer <admin_token>" \
  -F "name=My Web Scraper" \
  -F "description=Scrapes product data from e-commerce sites" \
  -F "type=web-scraper" \
  -F "category=e-commerce" \
  -F "visibility=private" \
  -F "tags=web-scraping,products,ecommerce"
```

### **Lấy danh sách Actor:**
```bash
curl -X GET "http://localhost:5000/api/actors?page=1&limit=10&status=ready" \
  -H "Authorization: Bearer <token>"
```

### **Cập nhật Actor:**
```bash
curl -X PUT http://localhost:5000/api/actors/64f1234567890abcdef \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Web Scraper",
    "description": "Updated description",
    "status": "ready"
  }'
```

### **Xóa Actor:**
```bash
curl -X DELETE http://localhost:5000/api/actors/64f1234567890abcdef \
  -H "Authorization: Bearer <admin_token>"
```

## 📝 Ví dụ sử dụng với JavaScript/Axios

### **Tạo Actor:**
```javascript
const formData = new FormData();
formData.append('name', 'My Web Scraper');
formData.append('description', 'Scrapes product data');
formData.append('type', 'web-scraper');
formData.append('category', 'e-commerce');

const response = await axios.post('/api/actors', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    ...formData.getHeaders()
  }
});
```

### **Lấy danh sách Actor:**
```javascript
const response = await axios.get('/api/actors', {
  headers: { 'Authorization': `Bearer ${token}` },
  params: {
    page: 1,
    limit: 10,
    status: 'ready',
    category: 'e-commerce'
  }
});
```

### **Cập nhật Actor:**
```javascript
const response = await axios.put(`/api/actors/${actorId}`, {
  name: 'Updated Web Scraper',
  description: 'Updated description',
  status: 'ready'
}, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### **Xóa Actor:**
```javascript
const response = await axios.delete(`/api/actors/${actorId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🔐 Authentication & Authorization

### **Token Required:**
Tất cả API đều yêu cầu JWT token trong header:
```
Authorization: Bearer <jwt_token>
```

### **Role Permissions:**
- **Admin**: Có thể thực hiện tất cả operations
- **Editor**: Có thể tạo, update, build, run actors
- **Viewer**: Chỉ có thể xem actors

## ⚠️ Error Responses

### **Validation Error (400):**
```json
{
  "success": false,
  "error": "Dữ liệu không hợp lệ",
  "details": [
    {
      "field": "name",
      "message": "Tên actor là bắt buộc",
      "value": ""
    }
  ]
}
```

### **Not Found Error (404):**
```json
{
  "success": false,
  "error": "Không tìm thấy actor"
}
```

### **Unauthorized Error (401):**
```json
{
  "success": false,
  "error": "Token không hợp lệ"
}
```

### **Forbidden Error (403):**
```json
{
  "success": false,
  "error": "Không có quyền thực hiện thao tác này"
}
```

## 🧪 Test API

Chạy script test để kiểm tra tất cả API:
```bash
node test-actor-crud.js
```

Script này sẽ test:
1. ✅ Login
2. ✅ Create Actor
3. ✅ Get All Actors
4. ✅ Get Actor by ID
5. ✅ Update Actor
6. ✅ Build Actor
7. ✅ Run Actor
8. ✅ Get Actor Stats
9. ✅ Delete Actor

## 📊 Status Values

### **Actor Status:**
- `draft`: Actor đang được tạo/chỉnh sửa
- `ready`: Actor đã build thành công, sẵn sàng chạy
- `running`: Actor đang chạy
- `error`: Actor gặp lỗi
- `inactive`: Actor bị vô hiệu hóa

### **Build Status:**
- `pending`: Chưa build
- `building`: Đang build
- `success`: Build thành công
- `failed`: Build thất bại

### **Run Status:**
- `idle`: Không chạy
- `running`: Đang chạy
- `completed`: Chạy hoàn thành
- `failed`: Chạy thất bại
- `stopped`: Bị dừng

## 🎯 Best Practices

1. **Validation**: Luôn validate dữ liệu trước khi gửi
2. **Error Handling**: Xử lý lỗi một cách graceful
3. **Pagination**: Sử dụng pagination cho danh sách lớn
4. **Filtering**: Sử dụng query parameters để filter
5. **Authentication**: Luôn gửi token trong header
6. **File Upload**: Sử dụng FormData cho file upload
7. **Status Tracking**: Theo dõi build/run status
8. **Metrics**: Thu thập performance metrics

## 🚀 Next Steps

1. **Frontend Integration**: Tích hợp với React frontend
2. **Real-time Updates**: WebSocket cho build/run status
3. **File Management**: Upload/download actor files
4. **Environment Variables**: Quản lý biến môi trường
5. **Git Integration**: Sync với Git repository
6. **Monitoring**: Dashboard monitoring
7. **Logging**: Centralized logging system 
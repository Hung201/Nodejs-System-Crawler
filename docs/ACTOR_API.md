# Actor API Documentation

## 🎯 Tổng quan
API để quản lý actors (web scrapers, data processors) với đầy đủ tính năng CRUD, build, run, và source code management.

## 📋 API Endpoints

### **1. Lấy tất cả Actors**
```http
GET /api/actors
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Trang hiện tại (default: 1)
- `limit` (number): Số lượng per page (default: 10)
- `status` (string): Lọc theo status
- `type` (string): Lọc theo type
- `search` (string): Tìm kiếm theo tên, mô tả, tags
- `category` (string): Lọc theo category
- `visibility` (string): Lọc theo visibility
- `buildStatus` (string): Lọc theo build status
- `runStatus` (string): Lọc theo run status

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1234567890abcdef",
      "name": "Web Scraper",
      "description": "Scrape product data",
      "type": "web-scraper",
      "status": "ready",
      "category": "web-scraping",
      "visibility": "private",
      "buildInfo": {
        "buildStatus": "success",
        "buildCount": 1
      },
      "runInfo": {
        "runStatus": "idle",
        "runCount": 0
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

### **2. Lấy Actor theo ID**
```http
GET /api/actors/:id
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64f1234567890abcdef",
    "name": "Web Scraper",
    "description": "Scrape product data",
    "type": "web-scraper",
    "status": "ready",
    "sourceCode": {
      "main.js": "const Apify = require('apify');...",
      "package.json": "{...}",
      "lastModified": "2025-08-05T10:30:00.000Z"
    },
    "buildInfo": {
      "buildStatus": "success",
      "buildCount": 1,
      "lastBuildAt": "2025-08-05T10:30:00.000Z"
    },
    "runInfo": {
      "runStatus": "idle",
      "runCount": 0
    },
    "metrics": {
      "averageRunTime": 5000,
      "successRate": 95.5,
      "totalDataProcessed": 1000
    }
  }
}
```

### **3. Tạo Actor mới**
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
name: Web Scraper
description: Scrape product data from e-commerce sites
type: web-scraper
status: draft
visibility: private
category: web-scraping
actorFile: [file upload - optional]
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "_id": "64f1234567890abcdef",
    "name": "Web Scraper",
    "status": "draft",
    "createdBy": {
      "_id": "64f1234567890abcdef",
      "name": "Admin User"
    }
  }
}
```

### **4. Cập nhật Actor**
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
  "visibility": "public"
}
```

### **5. Xóa Actor**
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

### **6. Build Actor**
```http
POST /api/actors/:id/build
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response Success (200):**
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

### **7. Chạy Actor**
```http
POST /api/actors/:id/run
```

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "input": {
    "url": "https://example.com",
    "maxPages": 10
  }
}
```

**Response Success (200):**
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

### **8. Chạy Actor với Streaming Output**
```http
POST /api/actors/:id/run/stream
```

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "input": {
    "url": "https://example.com",
    "maxPages": 10
  }
}
```

**Response (Streaming):**
```
[INFO] Starting actor: Web Scraper
[INFO] Run ID: run_1733456789012
[INFO] Input: {"url":"https://example.com","maxPages":10}

[OUT] Starting web scraping...
[OUT] Found 5 products on page 1
[OUT] Scraping product: Product 1
[OUT] Scraping product: Product 2
[ERR] Warning: Product 3 has no price
[OUT] Completed scraping page 1

[END] Process exited with code 0
[INFO] Execution completed
```

### **9. Lưu Source Code File**
```http
POST /api/actors/:id/source/file
```

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "filePath": "main.js",
  "content": "const Apify = require('apify');\n\nApify.main(async () => {\n    console.log('Hello World');\n});"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "File đã được lưu thành công",
  "data": {
    "filePath": "main.js",
    "content": "const Apify = require('apify');...",
    "lastModified": "2025-08-05T10:30:00.000Z"
  }
}
```

### **10. Lấy Source Code File**
```http
GET /api/actors/:id/source/file?filePath=main.js
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "filePath": "main.js",
    "content": "const Apify = require('apify');...",
    "language": "javascript",
    "lastModified": "2025-08-05T10:30:00.000Z"
  }
}
```

### **11. Lấy Danh Sách Source Files**
```http
GET /api/actors/:id/source/files
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "path": "main.js",
        "name": "main.js",
        "type": "file"
      },
      {
        "path": "package.json",
        "name": "package.json",
        "type": "file"
      }
    ],
    "lastModified": "2025-08-05T10:30:00.000Z"
  }
}
```

### **12. Cập nhật Source Code**
```http
PUT /api/actors/:id/source
```

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "main": "const Apify = require('apify');...",
  "package": "{\"name\": \"my-actor\", \"dependencies\": {\"apify\": \"^3.0.0\"}}",
  "inputSchema": "{\"title\": \"Input Schema\", \"type\": \"object\"}",
  "actorConfig": "{\"timeoutSecs\": 300}"
}
```

### **13. Lấy Build History**
```http
GET /api/actors/:id/builds
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "buildInfo": {
      "buildStatus": "success",
      "buildCount": 1,
      "lastBuildAt": "2025-08-05T10:30:00.000Z",
      "buildLog": "Build completed successfully"
    },
    "totalBuilds": 1
  }
}
```

### **14. Lấy Run History**
```http
GET /api/actors/:id/runs
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "runInfo": {
      "runStatus": "completed",
      "runCount": 1,
      "lastRunAt": "2025-08-05T10:30:00.000Z",
      "runLog": "Actor execution completed successfully"
    },
    "totalRuns": 1,
    "metrics": {
      "averageRunTime": 5000,
      "successRate": 95.5,
      "totalDataProcessed": 1000
    }
  }
}
```

### **15. Download Actor File**
```http
GET /api/actors/:id/download
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** File download

### **16. Lấy Actor Statistics**
```http
GET /api/actors/stats/overview
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total": 25,
      "active": 10,
      "inactive": 5,
      "draft": 10
    },
    "byType": [
      {
        "_id": "web-scraper",
        "count": 15
      },
      {
        "_id": "product-scraper",
        "count": 10
      }
    ]
  }
}
```

## 📊 Actor Status Values

| Status | Ý nghĩa | Mô tả |
|--------|---------|-------|
| `draft` | Nháp | Actor đang được tạo/chỉnh sửa |
| `ready` | Sẵn sàng | Actor đã build thành công, sẵn sàng chạy |
| `running` | Đang chạy | Actor đang chạy |
| `error` | Lỗi | Actor gặp lỗi |
| `inactive` | Tạm dừng | Actor bị vô hiệu hóa |
| `active` | Hoạt động | Legacy status (tương thích ngược) |

## 🔧 Actor Types

- `web-scraper`: Web scraping
- `news-scraper`: News scraping
- `product-scraper`: Product scraping
- `social-scraper`: Social media scraping
- `custom`: Custom actor

## 📂 Categories

- `web-scraping`: Web scraping
- `e-commerce`: E-commerce
- `news`: News & media
- `social-media`: Social media
- `data-processing`: Data processing
- `api-integration`: API integration
- `other`: Other

## 🔒 Visibility Levels

- `public`: Công khai
- `private`: Riêng tư
- `shared`: Chia sẻ

## 🚀 Workflow

1. **Tạo Actor** → Status: `draft`
2. **Lưu Source Code** → Các file được lưu vào database
3. **Build Actor** → Status: `ready`
4. **Run Actor** → Streaming output real-time
5. **Monitor** → Theo dõi execution progress

## 📝 Error Responses

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

### **Not Found (404):**
```json
{
  "success": false,
  "error": "Không tìm thấy actor"
}
```

### **Server Error (500):**
```json
{
  "success": false,
  "error": "Lỗi server khi tạo actor"
}
```

## 🔐 Authorization

- **Admin**: Có thể thực hiện tất cả operations
- **Editor**: Có thể tạo, cập nhật, build, run actors
- **Viewer**: Chỉ có thể xem actors

## 📋 Rate Limiting

- **Default**: 100 requests per 15 minutes
- **Upload**: 10 requests per 15 minutes
- **Streaming**: 5 concurrent streams per user

## 🎯 Best Practices

1. **File Management**: Sử dụng source code API thay vì file upload cho editor
2. **Streaming**: Sử dụng streaming API cho real-time output
3. **Status Tracking**: Theo dõi build/run status để UX tốt hơn
4. **Error Handling**: Xử lý lỗi gracefully với retry logic
5. **Security**: Validate input và sanitize code trước khi chạy

## 🎉 Tính năng nổi bật

- ✅ **Full CRUD Operations**
- ✅ **Source Code Management**
- ✅ **Real-time Streaming Execution**
- ✅ **Build & Run Tracking**
- ✅ **File Upload Support**
- ✅ **Statistics & Metrics**
- ✅ **Role-based Access Control**
- ✅ **Pagination & Filtering**
- ✅ **Search Functionality**
- ✅ **Error Handling**
- ✅ **Rate Limiting** 
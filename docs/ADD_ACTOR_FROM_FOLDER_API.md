# API Thêm Actor Từ Folder Cục Bộ

## Tổng quan

API này cho phép thêm actor vào hệ thống từ một đường dẫn folder cục bộ trên máy chủ. API sẽ đọc tất cả các file trong folder, tạo file zip và lưu trữ actor trong database.

## Endpoint

```
POST /api/actors/from-folder
```

## Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Request Body

```json
{
  "folderPath": "D:\\google-search-craw",
  "name": "google-search-crawler",
  "description": "Google Search Crawler imported from local folder",
  "type": "web-scraping",
  "category": "web-scraping",
  "visibility": "private"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folderPath` | string | ✅ | Đường dẫn tuyệt đối đến folder chứa actor |
| `name` | string | ✅ | Tên của actor (phải là duy nhất) |
| `description` | string | ❌ | Mô tả của actor |
| `type` | string | ❌ | Loại actor (default: "web-scraping") |
| `category` | string | ❌ | Danh mục actor (default: "web-scraping") |
| `visibility` | string | ❌ | Quyền truy cập (default: "private") |

## Response

### Success Response (200)

```json
{
  "success": true,
  "message": "Actor đã được thêm thành công từ folder",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "google-search-crawler",
    "folderPath": "D:\\google-search-craw",
    "zipFile": "actor-1754638173995_123456789.zip"
  }
}
```

### Error Responses

#### 400 - Bad Request
```json
{
  "success": false,
  "error": "Đường dẫn folder và tên actor là bắt buộc"
}
```

```json
{
  "success": false,
  "error": "Tên actor đã tồn tại"
}
```

```json
{
  "success": false,
  "error": "Đường dẫn không phải là folder"
}
```

```json
{
  "success": false,
  "error": "Không tìm thấy folder hoặc không có quyền truy cập"
}
```

#### 401 - Unauthorized
```json
{
  "success": false,
  "error": "Token không hợp lệ"
}
```

#### 403 - Forbidden
```json
{
  "success": false,
  "error": "Không có quyền truy cập"
}
```

#### 500 - Internal Server Error
```json
{
  "success": false,
  "error": "Lỗi server khi thêm actor từ folder"
}
```

## Cách hoạt động

1. **Validation**: Kiểm tra đường dẫn folder có tồn tại và là folder không
2. **File Reading**: Đọc các file quan trọng:
   - `package.json` - Thông tin package và main file
   - `input.json` - Schema input của actor
   - `apify.json` - Cấu hình actor
   - `main.js` hoặc file main được chỉ định trong package.json
3. **Zip Creation**: Tạo file zip chứa tất cả file trong folder (loại trừ node_modules, .git, .vscode)
4. **Database Storage**: Lưu thông tin actor vào database với:
   - Source code được extract
   - File zip được upload
   - Metadata từ các file config

## Cấu trúc folder actor

```
actor-folder/
├── package.json          # Thông tin package và dependencies
├── input.json           # Schema input của actor
├── apify.json           # Cấu hình actor
├── main.js              # File chính của actor
├── src/                 # Source code
├── routes/              # Routes (nếu có)
├── helpers/             # Helper functions
└── ...                  # Các file khác
```

## Ví dụ sử dụng

### JavaScript/Node.js

```javascript
const axios = require('axios');

async function addActorFromFolder() {
    try {
        const response = await axios.post(
            'http://localhost:5000/api/actors/from-folder',
            {
                folderPath: 'D:\\google-search-craw',
                name: 'google-search-crawler',
                description: 'Google Search Crawler',
                type: 'web-scraping',
                category: 'web-scraping',
                visibility: 'private'
            },
            {
                headers: {
                    'Authorization': 'Bearer your_jwt_token',
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Actor added successfully:', response.data);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}
```

### cURL

```bash
curl -X POST http://localhost:5000/api/actors/from-folder \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "folderPath": "D:\\google-search-craw",
    "name": "google-search-crawler",
    "description": "Google Search Crawler",
    "type": "web-scraping",
    "category": "web-scraping",
    "visibility": "private"
  }'
```

## Lưu ý

1. **Quyền truy cập**: API yêu cầu quyền admin hoặc editor
2. **Đường dẫn**: Phải sử dụng đường dẫn tuyệt đối
3. **Tên actor**: Phải là duy nhất trong hệ thống
4. **File loại trừ**: Các folder như `node_modules`, `.git`, `.vscode` sẽ bị loại trừ khỏi zip
5. **File loại trừ**: Các file như `.DS_Store`, `Thumbs.db` sẽ bị loại trừ
6. **Dependencies**: Cần cài đặt `archiver` và `extract-zip` (đã có sẵn trong package.json)

## Troubleshooting

### Lỗi thường gặp

1. **"Không tìm thấy folder"**: Kiểm tra đường dẫn có chính xác không
2. **"Không có quyền truy cập"**: Kiểm tra quyền đọc folder
3. **"Tên actor đã tồn tại"**: Đổi tên actor hoặc xóa actor cũ
4. **"Lỗi khi tạo file zip"**: Kiểm tra quyền ghi vào thư mục uploads

### Debug

Kiểm tra logs server để xem chi tiết lỗi:

```bash
tail -f logs/error.log
```

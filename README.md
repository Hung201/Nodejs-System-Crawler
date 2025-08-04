# System Crawler Backend

Backend API cho hệ thống crawler dữ liệu sử dụng Node.js, Express và MongoDB.

## 🚀 Tính năng

- **Authentication & Authorization**: JWT-based với role-based access control
- **Database**: MongoDB với Mongoose ODM
- **Security**: Helmet, CORS, Rate limiting
- **Validation**: Express-validator
- **Logging**: Winston logger
- **Error Handling**: Centralized error handling
- **File Upload**: Multer middleware

## 📋 Yêu cầu hệ thống

- Node.js >= 14.0.0
- MongoDB >= 4.4
- npm hoặc yarn

## 🛠️ Cài đặt

### Cách 1: Sử dụng Docker (Khuyến nghị)

1. **Clone repository**
```bash
git clone <repository-url>
cd backend
```

2. **Khởi động MongoDB với Docker**
```bash
# Chạy MongoDB container
docker-compose up -d mongodb

# Hoặc chạy với tên project cụ thể
docker-compose -p hung-mongodb-4rn up -d mongodb
```

3. **Cài đặt dependencies**
```bash
npm install
```

4. **Chạy ứng dụng**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Cách 2: Cài đặt MongoDB Local

1. **Cài đặt MongoDB**
```bash
# Windows
winget install MongoDB.Server

# Mac
brew install mongodb-community

# Ubuntu
sudo apt install mongodb
```

2. **Khởi động MongoDB**
```bash
mongod
```

3. **Cài đặt dependencies và chạy ứng dụng**
```bash
npm install
npm run dev
```

### Cách 3: Sử dụng MongoDB Atlas (Cloud)

1. Tạo account tại https://cloud.mongodb.com
2. Tạo cluster mới
3. Lấy connection string và cập nhật trong .env
4. Chạy ứng dụng

## 📁 Cấu trúc thư mục

```
backend/
├── config/          # Cấu hình database, auth
├── controllers/     # Business logic
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # External services
├── utils/           # Utility functions
├── logs/            # Log files
├── uploads/         # Uploaded files
├── server.js        # Entry point
└── package.json
```

## 🔧 Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/system_crawler

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin profile
- `PUT /api/auth/profile` - Cập nhật profile
- `PUT /api/auth/change-password` - Đổi mật khẩu

### Sources
- `GET /api/sources` - Lấy danh sách sources
- `POST /api/sources` - Tạo source mới
- `GET /api/sources/:id` - Lấy source theo ID
- `PUT /api/sources/:id` - Cập nhật source
- `DELETE /api/sources/:id` - Xóa source

### Data
- `GET /api/data` - Lấy danh sách data
- `GET /api/data/:id` - Lấy data theo ID
- `PUT /api/data/:id/approve` - Duyệt data
- `PUT /api/data/:id/reject` - Từ chối data
- `PUT /api/data/:id/translate` - Dịch data

### Users (Admin only)
- `GET /api/users` - Lấy danh sách users
- `POST /api/users` - Tạo user mới
- `GET /api/users/:id` - Lấy user theo ID
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user

### Dashboard
- `GET /api/dashboard/stats` - Thống kê tổng quan
- `GET /api/dashboard/recent-data` - Dữ liệu gần đây
- `GET /api/dashboard/chart-data` - Dữ liệu biểu đồ

## 🔐 Authentication

API sử dụng JWT Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/auth/profile
```

## 👥 Roles

- **admin**: Toàn quyền truy cập
- **editor**: Có thể tạo, sửa sources và data
- **viewer**: Chỉ xem dữ liệu

## 🧪 Testing

```bash
# Chạy tests
npm test

# Chạy tests với coverage
npm run test:coverage
```

## 📝 Logging

Logs được lưu trong thư mục `logs/`:
- `combined.log`: Tất cả logs
- `error.log`: Chỉ error logs

## 🚀 Deployment

1. **Production build**
```bash
npm run build
```

2. **Environment variables**
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-production-secret
```

3. **Process manager (PM2)**
```bash
npm install -g pm2
pm2 start server.js --name "system-crawler"
```

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License

## 🆘 Support

Nếu có vấn đề, vui lòng tạo issue trên GitHub. 
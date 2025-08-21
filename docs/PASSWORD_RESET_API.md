# API Quên Mật Khẩu

API này cung cấp các endpoint để xử lý quên mật khẩu với xác thực qua email.

## Các Endpoint

### 1. Gửi mã xác nhận quên mật khẩu

**POST** `/api/auth/forgot-password`

Gửi mã xác nhận đến email của người dùng.

#### Request Body
```json
{
  "email": "user@example.com"
}
```

#### Response Success (200)
```json
{
  "success": true,
  "message": "Mã xác nhận đã được gửi đến email của bạn",
  "data": {
    "email": "user@example.com"
  }
}
```

#### Response Error (400)
```json
{
  "success": false,
  "error": "Email không tồn tại trong hệ thống"
}
```

### 2. Xác thực mã xác nhận

**POST** `/api/auth/verify-reset-code`

Xác thực mã xác nhận từ email.

#### Request Body
```json
{
  "email": "user@example.com",
  "token": "abc123def456..."
}
```

#### Response Success (200)
```json
{
  "success": true,
  "message": "Mã xác nhận hợp lệ",
  "data": {
    "email": "user@example.com",
    "token": "abc123def456..."
  }
}
```

#### Response Error (400)
```json
{
  "success": false,
  "error": "Mã xác nhận không hợp lệ hoặc đã hết hạn"
}
```

### 3. Đặt lại mật khẩu

**POST** `/api/auth/reset-password`

Đặt lại mật khẩu với mã xác nhận đã được xác thực.

#### Request Body
```json
{
  "email": "user@example.com",
  "token": "abc123def456...",
  "newPassword": "newpassword123"
}
```

#### Response Success (200)
```json
{
  "success": true,
  "message": "Mật khẩu đã được đặt lại thành công",
  "data": {
    "email": "user@example.com"
  }
}
```

#### Response Error (400)
```json
{
  "success": false,
  "error": "Mã xác nhận không hợp lệ hoặc đã hết hạn"
}
```

### 4. Kiểm tra trạng thái token

**GET** `/api/auth/check-token-status`

Kiểm tra xem token có còn hợp lệ hay không.

#### Query Parameters
- `email`: Email của người dùng
- `token`: Mã xác nhận

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "valid": true,
    "message": "Token hợp lệ"
  }
}
```

#### Response Error (500)
```json
{
  "success": false,
  "error": "Có lỗi xảy ra khi kiểm tra token"
}
```

## Quy trình sử dụng

### Bước 1: Gửi yêu cầu quên mật khẩu
1. Người dùng nhập email vào form quên mật khẩu
2. Gọi API `POST /api/auth/forgot-password`
3. Hệ thống gửi mã xác nhận đến email

### Bước 2: Xác thực mã xác nhận
1. Người dùng nhập mã xác nhận từ email
2. Gọi API `POST /api/auth/verify-reset-code`
3. Hệ thống xác thực mã xác nhận

### Bước 3: Đặt lại mật khẩu
1. Người dùng nhập mật khẩu mới
2. Gọi API `POST /api/auth/reset-password`
3. Hệ thống cập nhật mật khẩu và gửi email thông báo

## Cấu hình Email

Để sử dụng chức năng gửi email, cần cấu hình các biến môi trường sau:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Configuration
EMAIL_FROM_NAME=System Crawler
FRONTEND_URL=http://localhost:3000
```

## Bảo mật

- Mã xác nhận có thời hạn 15 phút
- Mã xác nhận chỉ có thể sử dụng một lần
- Token được tạo ngẫu nhiên với độ dài 64 ký tự
- Email thông báo được gửi khi mật khẩu được thay đổi thành công

## Lưu ý

- Đảm bảo email tồn tại trong hệ thống trước khi gửi mã xác nhận
- Tài khoản phải có trạng thái `active` để có thể đặt lại mật khẩu
- Mã xác nhận sẽ tự động bị xóa sau khi hết hạn
- Có thể sử dụng endpoint `check-token-status` để kiểm tra trạng thái token trước khi cho phép người dùng nhập mật khẩu mới

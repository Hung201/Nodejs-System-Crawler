# Hướng Dẫn Cấu Hình API Quên Mật Khẩu

## Tổng Quan

API quên mật khẩu đã được tích hợp vào hệ thống với các tính năng:
- Gửi mã xác nhận qua email
- Xác thực mã xác nhận
- Đặt lại mật khẩu an toàn
- Tự động xóa token hết hạn

## Cấu Hình Cần Thiết

### 1. Biến Môi Trường (.env)

Thêm các biến sau vào file `.env`:

```env
# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Configuration
EMAIL_FROM_NAME=System Crawler
FRONTEND_URL=http://localhost:3000

# JWT Configuration (nếu chưa có)
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
```

### 2. Cấu Hình Gmail App Password

Để sử dụng Gmail SMTP, bạn cần:

1. Bật 2-Factor Authentication cho tài khoản Google
2. Tạo App Password:
   - Vào Google Account Settings
   - Security > 2-Step Verification > App passwords
   - Tạo password cho "Mail"
   - Sử dụng password này cho `SMTP_PASS`

### 3. Cấu Hình Khác

Nếu sử dụng SMTP khác (như SendGrid, Mailgun), cập nhật:
```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

## Cài Đặt Dependencies

Các dependencies đã có sẵn trong `package.json`:
- `nodemailer`: Gửi email
- `bcryptjs`: Mã hóa mật khẩu
- `crypto`: Tạo token ngẫu nhiên

## Cấu Trúc Database

### Model PasswordResetToken

```javascript
{
  email: String,        // Email người dùng
  token: String,        // Mã xác nhận (64 ký tự)
  expiresAt: Date,      // Thời gian hết hạn
  used: Boolean,        // Đã sử dụng chưa
  createdAt: Date       // Thời gian tạo
}
```

### Cập Nhật Model User

Đã thêm các trường:
- `passwordChangedAt`: Thời gian thay đổi mật khẩu
- `lastLogin`: Lần đăng nhập cuối

## API Endpoints

### 1. Gửi Mã Xác Nhận
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 2. Xác Thực Mã Xác Nhận
```http
POST /api/auth/verify-reset-code
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "abc123def456..."
}
```

### 3. Đặt Lại Mật Khẩu
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "abc123def456...",
  "newPassword": "newpassword123"
}
```

### 4. Kiểm Tra Token
```http
GET /api/auth/check-token-status?email=user@example.com&token=abc123def456...
```

## Quy Trình Sử Dụng

### Frontend Implementation

```javascript
// Bước 1: Gửi yêu cầu quên mật khẩu
const forgotPassword = async (email) => {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return response.json();
};

// Bước 2: Xác thực mã xác nhận
const verifyCode = async (email, token) => {
  const response = await fetch('/api/auth/verify-reset-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token })
  });
  return response.json();
};

// Bước 3: Đặt lại mật khẩu
const resetPassword = async (email, token, newPassword) => {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, newPassword })
  });
  return response.json();
};
```

### React Component Example

```jsx
import React, { useState } from 'react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: token, 3: password

  const handleSendCode = async () => {
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setStep(2);
        alert('Mã xác nhận đã được gửi đến email của bạn');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleVerifyCode = async () => {
    try {
      const result = await verifyCode(email, token);
      if (result.success) {
        setStep(3);
        alert('Mã xác nhận hợp lệ');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleResetPassword = async () => {
    try {
      const result = await resetPassword(email, token, newPassword);
      if (result.success) {
        alert('Mật khẩu đã được đặt lại thành công');
        // Redirect to login
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      {step === 1 && (
        <div>
          <h2>Quên Mật Khẩu</h2>
          <input
            type="email"
            placeholder="Nhập email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={handleSendCode}>Gửi Mã Xác Nhận</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Nhập Mã Xác Nhận</h2>
          <input
            type="text"
            placeholder="Nhập mã xác nhận"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button onClick={handleVerifyCode}>Xác Thực</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Đặt Lại Mật Khẩu</h2>
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button onClick={handleResetPassword}>Đặt Lại Mật Khẩu</button>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
```

## Testing

### 1. Sử Dụng Script Test
```bash
node scripts/test-password-reset.js
```

### 2. Sử Dụng Postman
Import file `postman/Password-Reset-API.postman_collection.json`

### 3. Test Thủ Công
1. Tạo user với email test
2. Gọi API gửi mã xác nhận
3. Kiểm tra email nhận được
4. Sử dụng mã để đặt lại mật khẩu

## Bảo Mật

### Tính Năng Bảo Mật
- Token có thời hạn 15 phút
- Token chỉ sử dụng được 1 lần
- Tự động xóa token hết hạn
- Mã hóa mật khẩu với bcrypt
- Validation đầy đủ

### Rate Limiting (Khuyến Nghị)
Thêm rate limiting để tránh spam:

```javascript
const rateLimit = require('express-rate-limit');

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 request
  message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút'
});

app.use('/api/auth/forgot-password', forgotPasswordLimiter);
```

## Troubleshooting

### Lỗi Thường Gặp

1. **Email không gửi được**
   - Kiểm tra cấu hình SMTP
   - Kiểm tra App Password Gmail
   - Kiểm tra firewall/antivirus

2. **Token không hợp lệ**
   - Kiểm tra thời gian hết hạn
   - Kiểm tra email có đúng không
   - Kiểm tra token đã được sử dụng chưa

3. **Database errors**
   - Kiểm tra kết nối MongoDB
   - Kiểm tra indexes đã được tạo

### Logs
Kiểm tra logs trong `logs/` để debug:
- `combined.log`: Tất cả requests
- `error.log`: Chỉ errors

## Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. Cấu hình SMTP
2. Database connection
3. Environment variables
4. Logs files

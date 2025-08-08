# MVC Refactor Documentation

## Tổng quan

Dự án đã được tái cấu trúc theo mô hình MVC (Model-View-Controller) để cải thiện tính bảo trì và khả năng mở rộng của code.

## Cấu trúc mới

### 1. Controllers (`/controllers/`)
Controllers chỉ chịu trách nhiệm:
- Nhận request từ client
- Validate input data
- Gọi services để xử lý business logic
- Trả về response cho client
- Xử lý lỗi và HTTP status codes

### 2. Services (`/services/`)
Services chứa toàn bộ business logic:
- Xử lý dữ liệu
- Tương tác với database
- Thực hiện các tính toán phức tạp
- Xử lý file system
- Gọi external APIs

### 3. Models (`/models/`)
Models định nghĩa cấu trúc dữ liệu và schema của database.

## Các Services đã tạo

### 1. AuthService (`/services/authService.js`)
**Chức năng:**
- Đăng ký user mới
- Đăng nhập user
- Lấy thông tin profile
- Cập nhật profile
- Thay đổi mật khẩu
- Tạo JWT token

**Methods:**
- `registerUser(userData)`
- `loginUser(email, password)`
- `getUserProfile(userId)`
- `updateUserProfile(userId, updateData)`
- `changeUserPassword(userId, currentPassword, newPassword)`
- `generateToken(userId)`

### 2. UserService (`/services/userService.js`)
**Chức năng:**
- Quản lý users (CRUD operations)
- Phân trang và lọc users
- Thống kê users
- Quản lý quyền truy cập

**Methods:**
- `getAllUsers(filters, pagination)`
- `createUser(userData, createdBy)`
- `getUserById(userId)`
- `updateUser(userId, updateData, currentUser)`
- `deleteUser(userId, currentUser)`
- `getUserStats()`
- `getMyProfile(userId)`
- `updateMyProfile(userId, updateData)`

### 3. CampaignService (`/services/campaignService.js`)
**Chức năng:**
- Quản lý campaigns (CRUD operations)
- Chạy campaigns
- Theo dõi trạng thái campaigns
- Xử lý actor execution

**Methods:**
- `getAllCampaigns(filters)`
- `getCampaignById(campaignId)`
- `createCampaign(campaignData, createdBy)`
- `runCampaign(campaignId)`
- `getCampaignStatus(campaignId)`
- `cancelCampaign(campaignId)`
- `deleteCampaign(campaignId)`

### 4. ActorService (`/services/actorService.js`)
**Chức năng:**
- Quản lý actors (CRUD operations)
- Upload và xử lý actor files
- Thống kê actors
- Quản lý actor metadata

**Methods:**
- `getAllActors(filters)`
- `getActorById(actorId)`
- `createActor(actorData, file, createdBy)`
- `updateActor(actorId, updateData, updatedBy)`
- `deleteActor(actorId)`
- `getActorStats()`

### 5. FileSystemService (`/services/fileSystemService.js`)
**Chức năng:**
- Quản lý file system cho actors
- Tạo thư mục actor
- Giải nén file zip
- Xóa thư mục actor

## Lợi ích của việc refactor

### 1. Separation of Concerns
- Controllers chỉ focus vào HTTP handling
- Services chứa business logic
- Models định nghĩa data structure

### 2. Reusability
- Services có thể được sử dụng bởi nhiều controllers
- Business logic được tách biệt và có thể tái sử dụng

### 3. Testability
- Services dễ dàng test độc lập
- Mocking và unit testing đơn giản hơn

### 4. Maintainability
- Code dễ đọc và hiểu hơn
- Dễ dàng thêm tính năng mới
- Dễ dàng sửa lỗi

### 5. Scalability
- Có thể dễ dàng thêm services mới
- Có thể tách services thành microservices trong tương lai

## Cách sử dụng

### Trong Controllers:
```javascript
const userService = require('../services/userService');

const getAllUsers = async (req, res) => {
    try {
        const filters = req.query;
        const result = await userService.getAllUsers(filters);
        res.json({
            success: true,
            data: result.users,
            pagination: result.pagination
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
```

### Error Handling:
Services throw errors với message cụ thể, controllers catch và trả về HTTP response phù hợp.

### Validation:
Controllers vẫn xử lý validation của request data trước khi gọi services.

## Best Practices

1. **Services không nên biết về HTTP context**
2. **Controllers không nên chứa business logic**
3. **Services throw errors, controllers handle HTTP responses**
4. **Sử dụng dependency injection khi cần thiết**
5. **Services nên có single responsibility**

## Migration Notes

- Tất cả business logic đã được chuyển từ controllers sang services
- Controllers giờ chỉ còn khoảng 10-20 dòng code mỗi function
- Error handling được cải thiện với specific error messages
- Code dễ test và maintain hơn

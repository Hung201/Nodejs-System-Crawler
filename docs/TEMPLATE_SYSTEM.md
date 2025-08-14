# 🎯 Hệ thống Website Templates

## 📋 Tổng quan

Hệ thống **Website Templates** cho phép tạo và quản lý các template cấu hình sẵn cho việc crawl dữ liệu từ các website khác nhau. Thay vì phải cấu hình selectors từ đầu cho mỗi campaign, người dùng có thể chọn template có sẵn và điều chỉnh nhẹ.

## 🚀 Lợi ích

### **1. Tiết kiệm thời gian**
- Không cần tìm selector từ đầu
- Không cần test cấu hình lại
- Tạo campaign nhanh chóng

### **2. Tăng độ tin cậy**
- Template đã được test kỹ
- Success rate cao
- Ít lỗi khi crawl

### **3. Dễ bảo trì**
- Khi website thay đổi, chỉ cần update template
- Tất cả campaign dùng template đó tự động được cập nhật

### **4. Khả năng mở rộng**
- Thêm website mới = tạo template mới
- Cộng đồng có thể chia sẻ template

## 📁 Cấu trúc Template

### **Schema chính**
```javascript
{
    name: String,                    // Tên template
    description: String,             // Mô tả
    website: String,                 // Tên website
    urlPattern: String,              // Pattern URL (ví dụ: "*.shopee.vn/*")
    category: String,                // Danh mục (ecommerce, news, blog, social, other)
    selectors: {                     // CSS Selectors
        title: String,               // Selector cho tiêu đề
        price: String,               // Selector cho giá
        image: String,               // Selector cho hình ảnh
        description: String,         // Selector cho mô tả
        sku: String,                 // Selector cho SKU
        category: String,            // Selector cho danh mục
        brand: String,               // Selector cho thương hiệu
        rating: String,              // Selector cho đánh giá
        reviews: String,             // Selector cho số review
        availability: String         // Selector cho tình trạng
    },
    filters: {                       // Bộ lọc
        priceMin: Number,            // Giá tối thiểu
        priceMax: Number,            // Giá tối đa
        ratingMin: Number,           // Đánh giá tối thiểu
        categories: [String],        // Danh mục cho phép
        brands: [String]             // Thương hiệu cho phép
    },
    config: {                        // Cấu hình crawl
        maxPages: Number,            // Số trang tối đa
        delay: Number,               // Delay giữa các request
        timeout: Number,             // Timeout cho request
        userAgent: String            // User agent
    },
    status: String,                  // Trạng thái (active, inactive, testing)
    isPublic: Boolean,               // Template công khai hay riêng tư
    successRate: Number,             // Tỷ lệ thành công (%)
    totalUses: Number,               // Số lần sử dụng
    createdBy: ObjectId,             // Người tạo
    tags: [String],                  // Tags
    version: String                  // Phiên bản
}
```

## 🔗 API Endpoints

### **Quản lý Templates**

#### **GET /api/templates**
Lấy danh sách templates với pagination và filters
```bash
GET /api/templates?page=1&limit=10&category=ecommerce&search=shopee
```

#### **GET /api/templates/stats**
Lấy thống kê templates
```bash
GET /api/templates/stats
```

#### **GET /api/templates/popular**
Lấy templates phổ biến
```bash
GET /api/templates/popular?limit=10
```

#### **GET /api/templates/find/:url**
Tìm template phù hợp cho URL
```bash
GET /api/templates/find/https://shopee.vn/dien-thoai
```

#### **GET /api/templates/:id**
Lấy template theo ID
```bash
GET /api/templates/507f1f77bcf86cd799439011
```

#### **POST /api/templates**
Tạo template mới
```bash
POST /api/templates
{
    "name": "Shopee Template",
    "description": "Template cho Shopee.vn",
    "website": "shopee.vn",
    "urlPattern": "*.shopee.vn/*",
    "category": "ecommerce",
    "selectors": {
        "title": ".product-name",
        "price": ".price",
        "image": ".product-image img"
    }
}
```

#### **PUT /api/templates/:id**
Cập nhật template
```bash
PUT /api/templates/507f1f77bcf86cd799439011
{
    "selectors": {
        "title": ".new-product-name"
    }
}
```

#### **DELETE /api/templates/:id**
Xóa template
```bash
DELETE /api/templates/507f1f77bcf86cd799439011
```

### **Tính năng nâng cao**

#### **POST /api/templates/:id/test**
Test template với URL
```bash
POST /api/templates/507f1f77bcf86cd799439011/test
{
    "testUrl": "https://shopee.vn/dien-thoai"
}
```

#### **POST /api/templates/:id/clone**
Clone template
```bash
POST /api/templates/507f1f77bcf86cd799439011/clone
{
    "newName": "Shopee Template (Copy)"
}
```

#### **GET /api/templates/search/tags**
Tìm kiếm template theo tags
```bash
GET /api/templates/search/tags?tags=ecommerce,shopee&limit=20
```

#### **PUT /api/templates/:id/success-rate**
Cập nhật success rate
```bash
PUT /api/templates/507f1f77bcf86cd799439011/success-rate
{
    "successRate": 95.5
}
```

## 💡 Ví dụ sử dụng

### **1. Tạo Template cho Shopee**
```javascript
const templateData = {
    name: 'Shopee Template',
    description: 'Template cho website Shopee.vn',
    website: 'shopee.vn',
    urlPattern: '*.shopee.vn/*',
    category: 'ecommerce',
    selectors: {
        title: '.product-name, .product-title, h1',
        price: '.price, .final-price, .product-price',
        image: '.product-image img, .thumbnail img',
        description: '.product-description, .description',
        sku: '.product-code, .sku',
        category: '.breadcrumb, .category',
        brand: '.brand-name, .brand',
        rating: '.rating, .stars',
        reviews: '.review-count, .reviews',
        availability: '.stock, .availability'
    },
    filters: {
        priceMin: 10000,
        priceMax: 50000000,
        ratingMin: 4.0,
        categories: ['Điện thoại', 'Laptop', 'Máy tính bảng'],
        brands: ['Apple', 'Samsung', 'Xiaomi', 'OPPO']
    },
    config: {
        maxPages: 20,
        delay: 1000,
        timeout: 30000,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    isPublic: true,
    tags: ['ecommerce', 'shopee', 'vietnam', 'mobile', 'electronics']
};
```

### **2. Tìm Template cho URL**
```javascript
// Tự động tìm template phù hợp cho URL
const template = await Template.findForUrl('https://shopee.vn/dien-thoai');
if (template) {
    console.log(`Found template: ${template.name}`);
    console.log(`Selectors: ${JSON.stringify(template.selectors)}`);
}
```

### **3. Tạo Campaign từ Template**
```javascript
// 1. Tìm template phù hợp
const template = await Template.findForUrl('https://shopee.vn/dien-thoai');

// 2. Tạo campaign với selectors từ template
const campaignData = {
    name: 'Crawl Shopee Điện thoại',
    description: 'Crawl sản phẩm điện thoại từ Shopee',
    actorId: actorId,
    input: {
        startUrls: ['https://shopee.vn/dien-thoai'],
        selectors: template.selectors,
        filters: template.filters,
        config: template.config
    }
};

// 3. Tạo campaign
const campaign = await createCampaign(campaignData, userId);
```

## 🔧 Cài đặt và Sử dụng

### **1. Tạo Templates mẫu**
```bash
node scripts/create-sample-templates.js
```

### **2. Kiểm tra Templates**
```bash
# Lấy danh sách templates
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/templates

# Lấy thống kê
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/templates/stats

# Tìm template cho URL
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/templates/find/https://shopee.vn/dien-thoai
```

### **3. Tạo Template mới**
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
         "name": "My Template",
         "description": "Template cho website của tôi",
         "website": "example.com",
         "urlPattern": "*.example.com/*",
         "category": "ecommerce",
         "selectors": {
             "title": ".product-title",
             "price": ".product-price"
         }
     }' \
     http://localhost:5000/api/templates
```

## 📊 Thống kê và Báo cáo

### **Template Statistics**
```javascript
{
    "overall": {
        "totalTemplates": 25,
        "activeTemplates": 20,
        "publicTemplates": 15,
        "totalUses": 1250,
        "avgSuccessRate": 92.5
    },
    "byCategory": [
        { "_id": "ecommerce", "count": 15, "totalUses": 800 },
        { "_id": "news", "count": 5, "totalUses": 300 },
        { "_id": "blog", "count": 3, "totalUses": 100 },
        { "_id": "social", "count": 2, "totalUses": 50 }
    ],
    "byWebsite": [
        { "_id": "shopee.vn", "count": 3, "totalUses": 400 },
        { "_id": "tiki.vn", "count": 2, "totalUses": 250 },
        { "_id": "lazada.vn", "count": 2, "totalUses": 200 }
    ]
}
```

## 🎯 Best Practices

### **1. Tạo Template hiệu quả**
- Sử dụng multiple selectors cho mỗi field
- Test template với nhiều URL khác nhau
- Cập nhật success rate thường xuyên

### **2. Quản lý Template**
- Đặt tên template rõ ràng và mô tả
- Sử dụng tags để phân loại
- Chia sẻ template công khai khi có thể

### **3. Bảo trì Template**
- Theo dõi success rate
- Cập nhật selectors khi website thay đổi
- Xóa template không còn sử dụng

## 🔄 Tích hợp với Campaign System

### **Luồng hoạt động**
1. **Tìm Template**: Hệ thống tự động tìm template phù hợp cho URL
2. **Áp dụng Selectors**: Sử dụng selectors từ template
3. **Điều chỉnh**: Cho phép override selectors nếu cần
4. **Chạy Campaign**: Thực hiện crawl với cấu hình từ template

### **Lợi ích tích hợp**
- Tạo campaign nhanh chóng
- Giảm lỗi cấu hình
- Tăng tỷ lệ thành công
- Dễ dàng mở rộng sang website mới

## 🚀 Roadmap

### **Phase 1: Core Features** ✅
- [x] CRUD Templates
- [x] Template matching by URL
- [x] Statistics and reporting
- [x] Sample templates

### **Phase 2: Advanced Features** 🔄
- [ ] Template versioning
- [ ] Template testing interface
- [ ] Template marketplace
- [ ] Community sharing

### **Phase 3: AI Features** 📋
- [ ] Auto-selector detection
- [ ] Template optimization
- [ ] Success rate prediction
- [ ] Smart template suggestions

---

**🎉 Hệ thống Website Templates đã sẵn sàng sử dụng!**

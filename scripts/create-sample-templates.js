const mongoose = require('mongoose');
const Template = require('../models/Template');
const User = require('../models/User');
require('dotenv').config();

// Sample templates data
const sampleTemplates = [
    {
        name: 'Shopee Template',
        description: 'Template cho website Shopee.vn - E-commerce platform',
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
        status: 'active',
        isPublic: true,
        successRate: 95,
        totalUses: 150,
        tags: ['ecommerce', 'shopee', 'vietnam', 'mobile', 'electronics']
    },
    {
        name: 'Tiki Template',
        description: 'Template cho website Tiki.vn - Online shopping platform',
        website: 'tiki.vn',
        urlPattern: '*.tiki.vn/*',
        category: 'ecommerce',
        selectors: {
            title: '.product-name, .title, h1',
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
            priceMin: 50000,
            priceMax: 100000000,
            ratingMin: 4.5,
            categories: ['Sách', 'Điện tử', 'Thời trang'],
            brands: ['Tiki', 'NXB', 'Fashion']
        },
        config: {
            maxPages: 15,
            delay: 1500,
            timeout: 30000,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        status: 'active',
        isPublic: true,
        successRate: 92,
        totalUses: 120,
        tags: ['ecommerce', 'tiki', 'vietnam', 'books', 'electronics']
    },
    {
        name: 'Lazada Template',
        description: 'Template cho website Lazada.vn - E-commerce platform',
        website: 'lazada.vn',
        urlPattern: '*.lazada.vn/*',
        category: 'ecommerce',
        selectors: {
            title: '.product-name, .title, h1',
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
            priceMin: 20000,
            priceMax: 75000000,
            ratingMin: 4.0,
            categories: ['Thời trang', 'Gia dụng', 'Điện tử'],
            brands: ['Lazada', 'Fashion', 'Home']
        },
        config: {
            maxPages: 25,
            delay: 1200,
            timeout: 30000,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        status: 'active',
        isPublic: true,
        successRate: 88,
        totalUses: 95,
        tags: ['ecommerce', 'lazada', 'vietnam', 'fashion', 'home']
    },
    {
        name: 'Daisan B2B Template',
        description: 'Template cho website b2b.daisan.vn - Building materials B2B platform',
        website: 'b2b.daisan.vn',
        urlPattern: '*.b2b.daisan.vn/*',
        category: 'ecommerce',
        selectors: {
            title: '.product-name, .title, h1, .product-title',
            price: '.price, .final-price, .product-price, .price-value',
            image: '.product-image img, .thumbnail img, .product-img',
            description: '.product-description, .description, .product-desc',
            sku: '.product-code, .sku, .product-sku',
            category: '.breadcrumb, .category, .product-category',
            brand: '.brand-name, .brand, .product-brand',
            rating: '.rating, .stars, .product-rating',
            reviews: '.review-count, .reviews, .product-reviews',
            availability: '.stock, .availability, .product-stock'
        },
        filters: {
            priceMin: 1000,
            priceMax: 100000000,
            ratingMin: 3.5,
            categories: ['Gạch ốp lát', 'Vật liệu xây dựng', 'Thiết bị vệ sinh'],
            brands: ['Viglacera', 'Đồng Tâm', 'Tasa']
        },
        config: {
            maxPages: 30,
            delay: 800,
            timeout: 30000,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        status: 'active',
        isPublic: true,
        successRate: 98,
        totalUses: 200,
        tags: ['b2b', 'daisan', 'vietnam', 'construction', 'building-materials']
    },
    {
        name: 'News Template',
        description: 'Template chung cho các website tin tức',
        website: 'news',
        urlPattern: '*.vnexpress.net/*, *.tuoitre.vn/*, *.thanhnien.vn/*',
        category: 'news',
        selectors: {
            title: '.title, .headline, h1, .article-title',
            price: null,
            image: '.article-image img, .thumbnail img, .featured-image',
            description: '.summary, .description, .article-summary',
            sku: null,
            category: '.category, .section, .breadcrumb',
            brand: '.author, .reporter, .writer',
            rating: null,
            reviews: '.comment-count, .comments',
            availability: null
        },
        filters: {
            categories: ['Thời sự', 'Kinh tế', 'Giải trí', 'Thể thao'],
            brands: []
        },
        config: {
            maxPages: 50,
            delay: 500,
            timeout: 20000,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        status: 'active',
        isPublic: true,
        successRate: 85,
        totalUses: 75,
        tags: ['news', 'vietnam', 'media', 'articles']
    }
];

async function createSampleTemplates() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_URI_PROD, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Get first admin user
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.log('❌ No admin user found. Please create an admin user first.');
            process.exit(1);
        }

        console.log(`👤 Using admin user: ${adminUser.name} (${adminUser.email})`);

        // Check if templates already exist
        const existingTemplates = await Template.find({});
        if (existingTemplates.length > 0) {
            console.log(`⚠️ Found ${existingTemplates.length} existing templates. Skipping creation.`);
            console.log('💡 To recreate templates, delete existing ones first.');
            process.exit(0);
        }

        // Create sample templates
        console.log('🚀 Creating sample templates...');
        const createdTemplates = [];

        for (const templateData of sampleTemplates) {
            const template = new Template({
                ...templateData,
                createdBy: adminUser._id
            });

            await template.save();
            createdTemplates.push(template);
            console.log(`✅ Created template: ${template.name}`);
        }

        console.log(`\n🎉 Successfully created ${createdTemplates.length} sample templates!`);
        console.log('\n📋 Created templates:');
        createdTemplates.forEach((template, index) => {
            console.log(`${index + 1}. ${template.name} (${template.website})`);
            console.log(`   - Category: ${template.category}`);
            console.log(`   - Success Rate: ${template.successRate}%`);
            console.log(`   - Total Uses: ${template.totalUses}`);
            console.log(`   - Tags: ${template.tags.join(', ')}`);
            console.log('');
        });

        console.log('🔗 API Endpoints:');
        console.log('GET /api/templates - Get all templates');
        console.log('GET /api/templates/stats - Get template statistics');
        console.log('GET /api/templates/popular - Get popular templates');
        console.log('GET /api/templates/find/:url - Find template for URL');
        console.log('POST /api/templates - Create new template');
        console.log('PUT /api/templates/:id - Update template');
        console.log('DELETE /api/templates/:id - Delete template');

    } catch (error) {
        console.error('❌ Error creating sample templates:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
createSampleTemplates();

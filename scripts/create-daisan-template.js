const mongoose = require('mongoose');
const Template = require('../models/Template');
const User = require('../models/User');
const Actor = require('../models/Actor');
require('dotenv').config();

async function createDaisanTemplate() {
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

        // Get first available actor
        const actor = await Actor.findOne({ status: { $in: ['active', 'ready'] } });
        if (!actor) {
            console.log('❌ No active/ready actor found. Please create an actor first.');
            process.exit(1);
        }

        console.log(`🎭 Using actor: ${actor.name} (${actor.type})`);

        // Check if template already exists
        const existingTemplate = await Template.findOne({
            name: 'DaisanB2B',
            createdBy: adminUser._id
        });

        if (existingTemplate) {
            console.log(`⚠️ Template "DaisanB2B" already exists. Skipping creation.`);
            console.log('💡 To recreate template, delete existing one first.');
            process.exit(0);
        }

        // Create DaisanB2B template
        console.log('🚀 Creating DaisanB2B template...');

        const templateData = {
            name: 'DaisanB2B',
            description: 'Template cho website b2b.daisan.vn - Gạch ốp tường với cấu hình crawl đầy đủ',
            website: 'b2b.daisan.vn',
            urlPattern: '*.b2b.daisan.vn/*',
            category: 'ecommerce',
            actorId: actor._id,
            actorType: actor.type,
            input: {
                "url": "https://b2b.daisan.vn/products/gach-op-tuong",
                "paginationPattern": "?page=",
                "pageStart": 1,
                "pageEnd": 2,
                "productLinkSelector": ".list-item-img a",
                "productLinkIncludePatterns": ["gach-"],
                "productLinkExcludePatterns": [
                    "gioi-thieu",
                    "tin-tuc",
                    "du-an",
                    "lien-he",
                    "about",
                    "news",
                    "contact",
                    "p="
                ],
                "titleClass": ".product-detail_title h1",
                "descriptionClass": ".product-attribute",
                "priceClass": ".price",
                "skuClass": "",
                "contentClass": ".description-info",
                "thumbnailClass": ".image-slider-item img",
                "imagesClass": ".thumb-slider .swiper-container .swiper-wrapper .swiper-slide",
                "includePatterns": [],
                "excludePatterns": [
                    "thumb",
                    "small",
                    "icon",
                    "logo"
                ],
                "skuInImage": false,
                "autoGenerateSku": true,
                "websiteName": "DAISANB2B",
                "isPrice": true,
                "isThumbnail": true,
                "category": "Gạch ốp tường",
                "supplier": "DAISANB2B",
                "url_supplier": "https://b2b.daisan.vn",
                "maxRequestsPerCrawl": 50000,
                "maxProductLinks": 50,
                "isBrowser": false
            },
            isPublic: true,
            tags: ["ecommerce", "daisan", "vietnam", "construction", "building-materials", "gach-op-tuong", "b2b"]
        };

        const template = new Template({
            ...templateData,
            createdBy: adminUser._id
        });

        await template.save();
        await template.populate('createdBy', 'name email');
        await template.populate('actorId', 'name description');

        console.log(`\n🎉 Successfully created DaisanB2B template!`);
        console.log('\n📋 Template details:');
        console.log(`   - Name: ${template.name}`);
        console.log(`   - Website: ${template.website}`);
        console.log(`   - Category: ${template.category}`);
        console.log(`   - Actor: ${template.actorId.name} (${template.actorType})`);
        console.log(`   - URL Pattern: ${template.urlPattern}`);
        console.log(`   - Tags: ${template.tags.join(', ')}`);
        console.log(`   - Input Fields: ${Object.keys(template.input).length} fields`);

        console.log('\n🔗 API Endpoints:');
        console.log('GET /api/templates - Get all templates');
        console.log('GET /api/templates/stats - Get template statistics');
        console.log('GET /api/templates/find-url/:url - Find template for URL');
        console.log('POST /api/templates/from-actor - Create template from actor');
        console.log('GET /api/templates/actors - Get available actors');
        console.log('GET /api/templates/actors/:actorId/schema - Get actor schema');

        console.log('\n🧪 Test the template:');
        console.log('POST /api/templates/' + template._id + '/test');
        console.log('Body: { "testUrl": "https://b2b.daisan.vn/products/gach-op-tuong" }');

    } catch (error) {
        console.error('❌ Error creating DaisanB2B template:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
createDaisanTemplate();

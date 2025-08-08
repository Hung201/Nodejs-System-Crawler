const axios = require('axios');

async function createTestCampaigns() {
    try {
        console.log('🔐 Step 1: Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = loginResponse.data.data.token;
        console.log('✅ Login thành công!');

        const actorId = '689464ac10595b979c15002a';

        // Tạo 3 campaigns với input khác nhau
        const campaigns = [
            {
                name: 'Test Campaign 1 - 10 Products',
                description: 'Test campaign với 10 sản phẩm',
                actorId: actorId,
                input: {
                    paginationPattern: "?page=",
                    url: "https://b2b.daisan.vn/products/gach-op-tuong",
                    pageStart: 1,
                    pageEnd: 1,
                    productLinkSelector: ".list-item-img a",
                    productLinkIncludePatterns: ["gach-"],
                    productLinkExcludePatterns: ["gioi-thieu", "tin-tuc", "du-an", "lien-he", "about", "news", "contact", "p="],
                    titleClass: ".product-detail_title h1",
                    descriptionClass: ".product-attribute",
                    priceClass: ".price",
                    skuClass: "",
                    contentClass: ".description-info",
                    thumbnailClass: ".image-slider-item img",
                    imagesClass: ".thumb-slider .swiper-container .swiper-wrapper .swiper-slide",
                    includePatterns: [],
                    excludePatterns: ["thumb", "small", "icon", "logo"],
                    skuInImage: false,
                    autoGenerateSku: true,
                    websiteName: "DAISANB2B",
                    isPrice: true,
                    isThumbnail: true,
                    category: "Gạch ốp tường",
                    supplier: "DAISANB2B",
                    url_supplier: "https://b2b.daisan.vn",
                    maxRequestsPerCrawl: 50000,
                    maxProductLinks: 10,
                    isBrowser: false
                }
            },
            {
                name: 'Test Campaign 2 - 15 Products',
                description: 'Test campaign với 15 sản phẩm',
                actorId: actorId,
                input: {
                    paginationPattern: "?page=",
                    url: "https://b2b.daisan.vn/products/gach-op-tuong",
                    pageStart: 1,
                    pageEnd: 1,
                    productLinkSelector: ".list-item-img a",
                    productLinkIncludePatterns: ["gach-"],
                    productLinkExcludePatterns: ["gioi-thieu", "tin-tuc", "du-an", "lien-he", "about", "news", "contact", "p="],
                    titleClass: ".product-detail_title h1",
                    descriptionClass: ".product-attribute",
                    priceClass: ".price",
                    skuClass: "",
                    contentClass: ".description-info",
                    thumbnailClass: ".image-slider-item img",
                    imagesClass: ".thumb-slider .swiper-container .swiper-wrapper .swiper-slide",
                    includePatterns: [],
                    excludePatterns: ["thumb", "small", "icon", "logo"],
                    skuInImage: false,
                    autoGenerateSku: true,
                    websiteName: "DAISANB2B",
                    isPrice: true,
                    isThumbnail: true,
                    category: "Gạch ốp tường",
                    supplier: "DAISANB2B",
                    url_supplier: "https://b2b.daisan.vn",
                    maxRequestsPerCrawl: 50000,
                    maxProductLinks: 15,
                    isBrowser: false
                }
            },
            {
                name: 'Test Campaign 3 - 20 Products',
                description: 'Test campaign với 20 sản phẩm',
                actorId: actorId,
                input: {
                    paginationPattern: "?page=",
                    url: "https://b2b.daisan.vn/products/gach-op-tuong",
                    pageStart: 1,
                    pageEnd: 1,
                    productLinkSelector: ".list-item-img a",
                    productLinkIncludePatterns: ["gach-"],
                    productLinkExcludePatterns: ["gioi-thieu", "tin-tuc", "du-an", "lien-he", "about", "news", "contact", "p="],
                    titleClass: ".product-detail_title h1",
                    descriptionClass: ".product-attribute",
                    priceClass: ".price",
                    skuClass: "",
                    contentClass: ".description-info",
                    thumbnailClass: ".image-slider-item img",
                    imagesClass: ".thumb-slider .swiper-container .swiper-wrapper .swiper-slide",
                    includePatterns: [],
                    excludePatterns: ["thumb", "small", "icon", "logo"],
                    skuInImage: false,
                    autoGenerateSku: true,
                    websiteName: "DAISANB2B",
                    isPrice: true,
                    isThumbnail: true,
                    category: "Gạch ốp tường",
                    supplier: "DAISANB2B",
                    url_supplier: "https://b2b.daisan.vn",
                    maxRequestsPerCrawl: 50000,
                    maxProductLinks: 20,
                    isBrowser: false
                }
            }
        ];

        console.log('\n🚀 Step 2: Tạo test campaigns...');

        for (let i = 0; i < campaigns.length; i++) {
            const campaign = campaigns[i];
            try {
                console.log(`\n📝 Creating campaign ${i + 1}: ${campaign.name}`);
                const response = await axios.post('http://localhost:5000/api/campaigns', campaign, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                console.log(`✅ Campaign ${i + 1} created:`, response.data.data._id);
            } catch (error) {
                console.log(`❌ Failed to create campaign ${i + 1}:`, error.response?.data?.error || error.message);
            }
        }

        console.log('\n📋 Step 3: Lấy danh sách campaigns...');
        const campaignsResponse = await axios.get(`http://localhost:5000/api/campaigns/actor/${actorId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const allCampaigns = campaignsResponse.data.data;
        console.log(`✅ Tổng cộng ${allCampaigns.length} campaigns cho actor ${actorId}`);

        allCampaigns.forEach((campaign, index) => {
            console.log(`\n--- Campaign ${index + 1} ---`);
            console.log('ID:', campaign._id);
            console.log('Name:', campaign.name);
            console.log('Status:', campaign.status);
            console.log('Records:', campaign.result?.recordsProcessed || 0);
        });

        console.log('\n🎉 Hoàn thành tạo test campaigns!');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

console.log('🚀 Creating Test Campaigns for Concurrent Testing');
console.log('=================================================');
console.log('Mục tiêu: Tạo nhiều campaigns để test concurrent execution');
console.log('='.repeat(80));
createTestCampaigns();

const axios = require('axios');

async function testCustomInputAPI() {
    try {
        console.log('🔐 Step 1: Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = loginResponse.data.data.token;
        console.log('✅ Login thành công!');

        const campaignId = '6894658410595b979c150037';

        // Custom input từ frontend (như trong ảnh Postman)
        const customInput = {
            paginationPattern: "?page=",
            url: "https://b2b.daisan.vn/products/gach-op-tuong",
            pageStart: 1,
            pageEnd: 2, // Thay đổi từ 1 thành 2 để test
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
            maxProductLinks: 15, // Thay đổi từ 30 thành 15 để test
            isBrowser: false
        };

        console.log('\n🚀 Step 2: Chạy campaign với custom input...');
        console.log('Campaign ID:', campaignId);
        console.log('Custom Input:', JSON.stringify(customInput, null, 2));

        try {
            const runResponse = await axios.post(`http://localhost:5000/api/campaigns/${campaignId}/run`, {
                input: customInput
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Campaign started:', runResponse.data.data.runId);

            // Monitor campaign
            console.log('\n📊 Step 3: Monitor campaign...');
            let attempts = 0;
            const maxAttempts = 30;

            while (attempts < maxAttempts) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 3000));

                try {
                    const statusResponse = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}/status`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const data = statusResponse.data.data;
                    console.log(`📊 Check #${attempts}: ${data.status} (${data.result?.recordsProcessed || 0} records)`);

                    if (data.status === 'completed') {
                        console.log('🎉 Campaign completed successfully!');
                        console.log('Records:', data.result?.recordsProcessed);
                        console.log('Duration:', data.result?.duration + 'ms');

                        // Hiển thị sample output
                        if (data.result?.output && data.result.output.length > 0) {
                            console.log('\n📋 Sample Output:');
                            console.log(JSON.stringify(data.result.output[0], null, 2));
                        }
                        break;
                    } else if (data.status === 'failed') {
                        console.log('❌ Campaign failed:', data.result?.error);
                        break;
                    }
                } catch (error) {
                    console.log('⚠️ Error checking status:', error.message);
                }
            }

        } catch (error) {
            console.log('❌ Failed to start campaign:', error.response?.data?.error || error.message);
        }

    } catch (error) {
        console.error('❌ Test Error:', error.response?.data || error.message);
    }
}

console.log('🧪 Testing Custom Input API');
console.log('============================');
console.log('Mục tiêu: Test API với custom input từ frontend');
console.log('API: POST /api/campaigns/{id}/run với body { input: {...} }');
console.log('='.repeat(80));
testCustomInputAPI();

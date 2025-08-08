const axios = require('axios');

async function testNewActor() {
    try {
        console.log('🚀 Testing new actor from D:\\actor-craw-by-class');
        console.log('='.repeat(60));

        // 1. Login
        console.log('\n1️⃣ Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });

        const token = loginResponse.data.data.token;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        console.log('✅ Login successful');

        // 2. Lấy danh sách actors
        console.log('\n2️⃣ Getting actors...');
        const actorsResponse = await axios.get('http://localhost:5000/api/actors', { headers });
        const actors = actorsResponse.data.data;
        console.log(`📋 Found ${actors.length} actors`);

        if (actors.length === 0) {
            console.log('❌ No actors found');
            return;
        }

        // Tìm actor mới nhất (có thể là actor vừa tạo)
        const latestActor = actors[0]; // Actor đầu tiên thường là mới nhất
        console.log(`📋 Using actor: ${latestActor.name} (${latestActor._id})`);
        console.log(`📋 Path: ${latestActor.path}`);

        // 3. Tạo campaign test với input DAISANB2B
        console.log('\n3️⃣ Creating test campaign...');
        const daisanb2bInput = {
            "url": "https://b2b.daisan.vn/products/gach-op-tuong",
            "paginationPattern": "?page=",
            "pageStart": 1,
            "pageEnd": 2,
            "productLinkSelector": ".list-item-img a",
            "productLinkIncludePatterns": [
                "gach-"
            ],
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
        };

        const campaignData = {
            name: 'Test DAISANB2B - Latest Actor',
            description: 'Test actor mới nhất từ D:\\actor-craw-by-class',
            actorId: latestActor._id,
            input: daisanb2bInput
        };

        const createResponse = await axios.post('http://localhost:5000/api/campaigns', campaignData, { headers });
        console.log('✅ Campaign created:', createResponse.data.data._id);

        const campaignId = createResponse.data.data._id;

        // 4. Chạy campaign
        console.log('\n4️⃣ Running campaign...');
        const runResponse = await axios.post(`http://localhost:5000/api/campaigns/${campaignId}/run`, {}, { headers });
        console.log('✅ Campaign started:', runResponse.data.data.runId);

        // 5. Monitor campaign status
        console.log('\n5️⃣ Monitoring campaign status...');
        let status = 'running';
        let attempts = 0;
        const maxAttempts = 30; // 2.5 phút

        while (status === 'running' && attempts < maxAttempts) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 5000)); // Đợi 5 giây

            try {
                const statusResponse = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}/status`, { headers });
                const campaignStatus = statusResponse.data.data;
                status = campaignStatus.status;

                console.log(`\n📊 Status check ${attempts}: ${status}`);
                console.log(`   Duration: ${campaignStatus.result.duration || 0}ms`);
                console.log(`   Records: ${campaignStatus.result.recordsProcessed || 0}`);

                if (status === 'completed') {
                    console.log('\n🎉 Campaign completed successfully!');
                    console.log(`📈 Total records: ${campaignStatus.result.recordsProcessed}`);
                    console.log(`⏱️  Duration: ${campaignStatus.result.duration}ms`);

                    // Hiển thị một vài sản phẩm đầu tiên
                    if (campaignStatus.result.output && campaignStatus.result.output.length > 0) {
                        console.log('\n📋 Sample products:');
                        campaignStatus.result.output.slice(0, 3).forEach((product, index) => {
                            console.log(`\n   Product ${index + 1}:`);
                            console.log(`   - Title: ${product.title || 'N/A'}`);
                            console.log(`   - Price: ${product.price || 'N/A'}`);
                            console.log(`   - SKU: ${product.sku || 'N/A'}`);
                            console.log(`   - Images: ${product.images ? product.images.length : 0} images`);
                        });
                    }
                    break;
                } else if (status === 'failed') {
                    console.log('\n❌ Campaign failed!');
                    console.log(`Error: ${campaignStatus.result.error}`);
                    break;
                }
            } catch (error) {
                console.log(`❌ Error checking status: ${error.message}`);
            }
        }

        if (status === 'running') {
            console.log('\n⏰ Campaign still running after 2.5 minutes, stopping monitoring...');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testNewActor();

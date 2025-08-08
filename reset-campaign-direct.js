const axios = require('axios');

async function resetCampaignDirect() {
    try {
        console.log('🔐 Login...');
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = login.data.data.token;
        console.log('✅ Login OK');

        const campaignId = '6894658410595b979c150037';

        console.log('\n🔄 Reset campaign to pending...');

        // Reset campaign bằng cách update với status pending
        const resetData = {
            status: 'pending',
            result: {
                log: '',
                output: [],
                error: 'Campaign reset manually',
                startTime: null,
                endTime: null,
                duration: 0,
                recordsProcessed: 0
            }
        };

        // Sử dụng MongoDB trực tiếp hoặc tạo API endpoint mới
        console.log('📝 Reset data:', JSON.stringify(resetData, null, 2));

        // Thử update qua API
        try {
            const update = await axios.put(`http://localhost:5000/api/campaigns/${campaignId}`, {
                name: 'Test DAISANB2B - Latest Actor (Updated)',
                description: 'Test actor với input schema DAISANB2B',
                actorId: '689464ac10595b979c15002a',
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
                    maxProductLinks: 30,
                    isBrowser: false
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Campaign reset via API');

            // Check status
            const status = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('New Status:', status.data.data.status);

        } catch (e) {
            console.log('❌ API reset failed:', e.response?.data?.error || e.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

resetCampaignDirect();

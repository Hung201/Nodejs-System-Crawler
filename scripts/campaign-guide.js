const axios = require('axios');

async function campaignGuide() {
    try {
        console.log('🎯 HƯỚNG DẪN TẠO CAMPAIGN VỚI ACTOR VÀ INPUT KHÁC');
        console.log('==================================================');

        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';
        const actorId = '68a534b2ab88595f6f4007b5';

        // Bước 1: Tạo campaign với input khác
        console.log('\n📋 Bước 1: Tạo campaign với input khác...');
        const createResponse = await axios.post(
            'http://localhost:5000/api/campaigns',
            {
                name: `Campaign Gạch Ốp Lát - ${new Date().toISOString().slice(0, 19)}`,
                description: 'Campaign chạy actor với từ khóa khác',
                actorId: actorId,
                input: {
                    searchTerms: ['gạch ốp lát Ý', 'gạch ốp lát Tây Ban Nha', 'gạch ốp lát cao cấp'],
                    maxRequests: 3
                },
                config: {
                    timeout: 300000,
                    maxRetries: 3
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const campaignId = createResponse.data.data._id;
        console.log('✅ Campaign created successfully!');
        console.log('🆔 Campaign ID:', campaignId);
        console.log('📋 Campaign Name:', createResponse.data.data.name);
        console.log('📊 Input:', JSON.stringify(createResponse.data.data.input, null, 2));

        // Bước 2: Chạy campaign
        console.log('\n▶️ Bước 2: Chạy campaign...');
        const runResponse = await axios.post(
            `http://localhost:5000/api/campaigns/${campaignId}/run`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Campaign started!');
        console.log('🆔 Run ID:', runResponse.data.data.runId);
        console.log('📊 Status:', runResponse.data.data.status);

        // Bước 3: Đợi và kiểm tra kết quả
        console.log('\n⏳ Bước 3: Đợi campaign hoàn thành...');

        for (let i = 1; i <= 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                const statusResponse = await axios.get(
                    `http://localhost:5000/api/campaigns/${campaignId}/status`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                const campaign = statusResponse.data.data;
                console.log(`⏱️  ${i * 2}s - Status: ${campaign.status}`);

                if (campaign.status === 'completed') {
                    console.log('✅ Campaign completed successfully!');
                    console.log('📊 Records processed:', campaign.result?.recordsProcessed || 0);
                    console.log('⏱️  Duration:', campaign.result?.duration ? `${Math.round(campaign.result.duration / 1000)}s` : 'N/A');
                    break;
                } else if (campaign.status === 'failed') {
                    console.log('❌ Campaign failed!');
                    console.log('📋 Error:', campaign.result?.error);
                    break;
                }

            } catch (error) {
                console.log(`❌ Error checking status (${i * 2}s):`, error.response?.data || error.message);
            }
        }

        // Bước 4: Xem kết quả chi tiết
        console.log('\n📊 Bước 4: Xem kết quả chi tiết...');
        const campaignResponse = await axios.get(
            `http://localhost:5000/api/campaigns/${campaignId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const campaign = campaignResponse.data.data;
        console.log('📋 Campaign Details:');
        console.log('   Name:', campaign.name);
        console.log('   Status:', campaign.status);
        console.log('   Records Processed:', campaign.result?.recordsProcessed || 0);
        console.log('   Duration:', campaign.result?.duration ? `${Math.round(campaign.result.duration / 1000)}s` : 'N/A');

        if (campaign.result?.output && campaign.result.output.length > 0) {
            console.log('\n📊 Scraped Data Preview:');
            console.log('   Total Results:', campaign.result.output.length);
            campaign.result.output.slice(0, 3).forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.title || item.name || 'No title'}`);
                console.log(`      URL: ${item.url || 'No URL'}`);
            });
        }

        console.log('\n🎯 TÓM TẮT QUY TRÌNH:');
        console.log('=====================');
        console.log('1. Tạo campaign với POST /api/campaigns');
        console.log('2. Chạy campaign với POST /api/campaigns/{id}/run');
        console.log('3. Kiểm tra trạng thái với GET /api/campaigns/{id}/status');
        console.log('4. Xem kết quả với GET /api/campaigns/{id}');
        console.log('\n🆔 Campaign ID:', campaignId);
        console.log('🎭 Actor ID:', actorId);
        console.log('📊 Input khác:', JSON.stringify(createResponse.data.data.input, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

campaignGuide();

const axios = require('axios');

async function createCampaignSimple() {
    try {
        console.log('🚀 Tạo Campaign mới với input khác...');

        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';
        const actorId = '68a534b2ab88595f6f4007b5';

        // Tạo campaign với input khác
        const createResponse = await axios.post(
            'http://localhost:5000/api/campaigns',
            {
                name: `Campaign Gạch Ốp Lát - ${new Date().toISOString().slice(0, 19)}`,
                description: 'Campaign chạy actor với từ khóa mới',
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
        console.log('📊 Input:', createResponse.data.data.input);

        // Chạy campaign
        console.log('\n▶️ Chạy campaign...');
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

        console.log('\n🎯 Campaign đã được tạo và chạy thành công!');
        console.log('🆔 Campaign ID:', campaignId);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

createCampaignSimple();

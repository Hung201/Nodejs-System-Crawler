const axios = require('axios');

async function testUpdateCampaign() {
    try {
        console.log('🔍 Testing campaign update...');

        // Test data
        const campaignId = '6894658410595b979c150037';
        const updateData = {
            name: 'Test DAISANB2B - Updated Name',
            actorId: '689464ac10595b979c15002a'
        };

        console.log('📝 Update data:', updateData);

        const response = await axios.put(`http://localhost:5000/api/campaigns/${campaignId}`, updateData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_TOKEN_HERE' // Thay bằng token thực
            }
        });

        console.log('✅ Success!');
        console.log('Response:', response.data);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testUpdateCampaign();

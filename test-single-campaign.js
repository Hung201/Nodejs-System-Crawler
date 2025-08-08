const axios = require('axios');

async function testSingleCampaign() {
    try {
        console.log('🔐 Step 1: Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = loginResponse.data.data.token;
        console.log('✅ Login thành công!');

        const campaignId = '68959ffb4bb5b6a75e4145f7'; // Test Campaign 1 - 10 Products

        console.log('\n🚀 Step 2: Chạy single campaign...');
        console.log('Campaign ID:', campaignId);

        try {
            const runResponse = await axios.post(`http://localhost:5000/api/campaigns/${campaignId}/run`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('✅ Campaign started:', runResponse.data.data.runId);

            // Monitor campaign
            console.log('\n📊 Step 3: Monitor campaign...');
            let attempts = 0;
            const maxAttempts = 20;

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

console.log('🧪 Testing Single Campaign');
console.log('==========================');
console.log('Mục tiêu: Test single campaign để debug issues');
console.log('='.repeat(80));
testSingleCampaign();

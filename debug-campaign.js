const axios = require('axios');

async function debugCampaign() {
    try {
        console.log('🔐 Login...');
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = login.data.data.token;
        console.log('✅ Login OK');

        console.log('\n📊 Get campaign details...');
        const campaign = await axios.get('http://localhost:5000/api/campaigns/6894658410595b979c150037', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = campaign.data.data;
        console.log('Status:', data.status);
        console.log('Records:', data.result?.recordsProcessed || 0);
        console.log('Start Time:', data.result?.startTime);
        console.log('End Time:', data.result?.endTime);
        console.log('Duration:', data.result?.duration);
        console.log('Error:', data.result?.error);

        if (data.result?.startTime) {
            const startTime = new Date(data.result.startTime);
            const now = new Date();
            const durationMs = now - startTime;
            const durationMinutes = Math.floor(durationMs / (1000 * 60));
            console.log(`\n⏱️ Campaign đã chạy: ${durationMinutes} phút`);

            if (data.result?.recordsProcessed > 0 && durationMinutes > 5) {
                console.log('🔄 Should force complete...');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

debugCampaign();

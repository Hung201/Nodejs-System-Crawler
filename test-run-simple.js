const axios = require('axios');

async function testRun() {
    try {
        // Login
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = loginResponse.data.data.token;
        console.log('✅ Login thành công');

        // Run campaign
        console.log('🚀 Gọi API run campaign...');
        const runResponse = await axios.post('http://localhost:5000/api/campaigns/6894658410595b979c150037/run', {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Campaign đã start:');
        console.log('- Campaign ID:', runResponse.data.data.campaignId);
        console.log('- Run ID:', runResponse.data.data.runId);
        console.log('- Status:', runResponse.data.data.status);

        console.log('\n📊 Đợi 30 giây rồi check status...');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testRun();

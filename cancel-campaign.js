const axios = require('axios');

async function cancelCampaign() {
    try {
        // Login
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = loginResponse.data.data.token;

        console.log('🛑 Canceling campaign...');

        // Cancel campaign
        const cancelResponse = await axios.post('http://localhost:5000/api/campaigns/6894658410595b979c150037/cancel', {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Campaign canceled!');
        console.log('Response:', cancelResponse.data);

        // Check status after cancel
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await axios.get('http://localhost:5000/api/campaigns/6894658410595b979c150037/status', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('\n📊 Status after cancel:');
        console.log('Status:', statusResponse.data.data.status);
        console.log('Records preserved:', statusResponse.data.data.result?.recordsProcessed || 0);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

cancelCampaign();
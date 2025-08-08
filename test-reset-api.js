const axios = require('axios');

async function testResetAPI() {
    try {
        console.log('🔐 Login...');
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = login.data.data.token;
        console.log('✅ Login OK');

        const campaignId = '6894658410595b979c150037';

        console.log('\n📊 Check current status...');
        const status = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Current Status:', status.data.data.status);
        console.log('Records:', status.data.data.result?.recordsProcessed || 0);

        console.log('\n🔄 Reset campaign...');
        const reset = await axios.post(`http://localhost:5000/api/campaigns/${campaignId}/reset`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Reset Result:', reset.data);

        console.log('\n📊 Check new status...');
        const newStatus = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('New Status:', newStatus.data.data.status);
        console.log('Records:', newStatus.data.data.result?.recordsProcessed || 0);

        console.log('\n🚀 Try to run campaign...');
        try {
            const run = await axios.post(`http://localhost:5000/api/campaigns/${campaignId}/run`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Run OK:', run.data.data.runId);
        } catch (e) {
            console.log('❌ Run failed:', e.response?.data?.error || e.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testResetAPI();

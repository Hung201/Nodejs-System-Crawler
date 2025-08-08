const axios = require('axios');

async function checkCampaignStatus() {
    try {
        // Login
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = loginResponse.data.data.token;

        // Get status
        const statusResponse = await axios.get('http://localhost:5000/api/campaigns/6894658410595b979c150037/status', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = statusResponse.data.data;
        console.log('📊 Campaign Status Details:');
        console.log('Status:', data.status);
        console.log('Records processed:', data.result?.recordsProcessed || 0);
        console.log('Start time:', data.result?.startTime);
        console.log('End time:', data.result?.endTime || 'Not finished');
        console.log('Duration:', data.result?.duration || 'Still running');
        console.log('Error:', data.result?.error || 'None');

        if (data.result?.log) {
            console.log('\n📋 Log (last 300 chars):');
            console.log(data.result.log.slice(-300));
        }

        if (data.result?.output && data.result.output.length > 0) {
            console.log(`\n🎉 Output: ${data.result.output.length} products found`);
        }

        // Check if we should manually complete it
        if (data.status === 'running' && data.result?.output && data.result.output.length > 0) {
            console.log('\n⚠️  Campaign has data but still running. This might indicate:');
            console.log('1. Actor process is still running in background');
            console.log('2. Campaign service didn\'t detect completion properly');
            console.log('3. Actor didn\'t exit with code 0');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

checkCampaignStatus();

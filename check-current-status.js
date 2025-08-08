const axios = require('axios');

async function checkStatus() {
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
        console.log('📊 Current Campaign Status:');
        console.log('Status:', data.status);
        console.log('Records:', data.result?.recordsProcessed || 0);
        console.log('Start time:', data.result?.startTime);
        console.log('End time:', data.result?.endTime || 'Not finished');
        console.log('Duration:', data.result?.duration || 'Still running');

        if (data.result?.output && data.result.output.length > 0) {
            console.log(`🎉 Output: ${data.result.output.length} products found`);
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

checkStatus();

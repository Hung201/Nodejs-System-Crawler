const axios = require('axios');

async function cancelCampaign() {
    try {
        console.log('🚀 Cancelling running campaign...');

        // 1. Login
        console.log('\n1️⃣ Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });

        const token = loginResponse.data.data.token;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        console.log('✅ Login successful');

        // 2. Cancel campaign
        console.log('\n2️⃣ Cancelling campaign...');
        const campaignId = '6894503a43ef59ef94620d39';
        try {
            await axios.post(`http://localhost:5000/api/campaigns/${campaignId}/cancel`, {}, { headers });
            console.log('✅ Campaign cancelled successfully');
        } catch (error) {
            console.log('Campaign not found or already stopped');
        }

        // 3. Delete campaign
        console.log('\n3️⃣ Deleting campaign...');
        try {
            await axios.delete(`http://localhost:5000/api/campaigns/${campaignId}`, { headers });
            console.log('✅ Campaign deleted successfully');
        } catch (error) {
            console.log('Campaign not found or already deleted');
        }

        console.log('\n✅ Cleanup completed. Now run: node upload-local-actor.js');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

cancelCampaign();

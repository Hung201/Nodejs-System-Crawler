const axios = require('axios');

async function deleteAndReupload() {
    try {
        console.log('🚀 Deleting old actor and reuploading...');

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

        // 2. Delete old actor
        console.log('\n2️⃣ Deleting old actor...');
        const actorId = '68944e2ab68d7b6bfdc5071b';
        try {
            await axios.delete(`http://localhost:5000/api/actors/${actorId}`, { headers });
            console.log('✅ Old actor deleted');
        } catch (error) {
            console.log('Actor not found or already deleted');
        }

        // 3. Delete old campaign
        console.log('\n3️⃣ Deleting old campaign...');
        const campaignId = '68944e2ab68d7b6bfdc50721';
        try {
            await axios.delete(`http://localhost:5000/api/campaigns/${campaignId}`, { headers });
            console.log('✅ Old campaign deleted');
        } catch (error) {
            console.log('Campaign not found or already deleted');
        }

        console.log('\n✅ Cleanup completed. Now run: node upload-local-actor.js');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

deleteAndReupload();

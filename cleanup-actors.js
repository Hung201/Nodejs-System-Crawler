const axios = require('axios');

async function cleanupActors() {
    try {
        console.log('🧹 Cleaning up all actors and campaigns');
        console.log('='.repeat(50));

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

        // 2. Lấy danh sách actors hiện tại
        console.log('\n2️⃣ Getting current actors...');
        const actorsResponse = await axios.get('http://localhost:5000/api/actors', { headers });
        const actors = actorsResponse.data.data;
        console.log(`📋 Found ${actors.length} actors`);

        // 3. Xóa tất cả actors hiện tại
        console.log('\n3️⃣ Deleting all current actors...');
        for (const actor of actors) {
            try {
                await axios.delete(`http://localhost:5000/api/actors/${actor._id}`, { headers });
                console.log(`✅ Deleted actor: ${actor.name} (${actor._id})`);
            } catch (error) {
                console.log(`❌ Failed to delete actor ${actor._id}: ${error.response?.data?.error || error.message}`);
            }
        }

        // 4. Lấy danh sách campaigns và xóa
        console.log('\n4️⃣ Getting and deleting campaigns...');
        const campaignsResponse = await axios.get('http://localhost:5000/api/campaigns', { headers });
        const campaigns = campaignsResponse.data.data;
        console.log(`📋 Found ${campaigns.length} campaigns`);

        for (const campaign of campaigns) {
            try {
                if (campaign.status === 'running') {
                    // Cancel running campaign first
                    await axios.post(`http://localhost:5000/api/campaigns/${campaign._id}/cancel`, {}, { headers });
                    console.log(`✅ Cancelled running campaign: ${campaign.name}`);
                }
                await axios.delete(`http://localhost:5000/api/campaigns/${campaign._id}`, { headers });
                console.log(`✅ Deleted campaign: ${campaign.name} (${campaign._id})`);
            } catch (error) {
                console.log(`❌ Failed to delete campaign ${campaign._id}: ${error.response?.data?.error || error.message}`);
            }
        }

        console.log('\n🎉 Cleanup completed successfully!');
        console.log('📋 You can now upload the new actor from D:\\actor-craw-by-class');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

cleanupActors();

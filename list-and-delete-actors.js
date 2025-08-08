const axios = require('axios');

async function listAndDeleteActors() {
    try {
        console.log('🚀 Listing and deleting actors...');

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

        // 2. Get all actors
        console.log('\n2️⃣ Getting all actors...');
        const actorsResponse = await axios.get('http://localhost:5000/api/actors', { headers });
        const actors = actorsResponse.data.data;
        console.log(`Found ${actors.length} actors:`);

        actors.forEach((actor, index) => {
            console.log(`   ${index + 1}. ${actor.name} (${actor._id}) - ${actor.status}`);
        });

        // 3. Delete all actors
        console.log('\n3️⃣ Deleting all actors...');
        for (const actor of actors) {
            try {
                await axios.delete(`http://localhost:5000/api/actors/${actor._id}`, { headers });
                console.log(`✅ Deleted actor: ${actor.name}`);
            } catch (error) {
                console.log(`❌ Failed to delete actor ${actor.name}:`, error.response?.data || error.message);
            }
        }

        // 4. Get all campaigns
        console.log('\n4️⃣ Getting all campaigns...');
        const campaignsResponse = await axios.get('http://localhost:5000/api/campaigns', { headers });
        const campaigns = campaignsResponse.data.data;
        console.log(`Found ${campaigns.length} campaigns:`);

        campaigns.forEach((campaign, index) => {
            console.log(`   ${index + 1}. ${campaign.name} (${campaign._id}) - ${campaign.status}`);
        });

        // 5. Delete all campaigns
        console.log('\n5️⃣ Deleting all campaigns...');
        for (const campaign of campaigns) {
            try {
                await axios.delete(`http://localhost:5000/api/campaigns/${campaign._id}`, { headers });
                console.log(`✅ Deleted campaign: ${campaign.name}`);
            } catch (error) {
                console.log(`❌ Failed to delete campaign ${campaign.name}:`, error.response?.data || error.message);
            }
        }

        console.log('\n✅ Cleanup completed. Now run: node upload-local-actor.js');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

listAndDeleteActors();

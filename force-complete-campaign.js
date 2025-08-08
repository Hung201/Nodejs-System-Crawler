const axios = require('axios');

async function forceCompleteCampaign() {
    try {
        console.log('🔐 Login...');
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = login.data.data.token;
        console.log('✅ Login OK');

        const campaignId = '6894658410595b979c150037';

        console.log('\n📊 Get campaign details...');
        const campaign = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = campaign.data.data;
        console.log('Current Status:', data.status);
        console.log('Records:', data.result?.recordsProcessed || 0);

        if (data.status === 'running' && data.result?.recordsProcessed > 0) {
            console.log('\n🔄 Force completing campaign...');

            // Update campaign để force complete
            const updateData = {
                name: data.name,
                description: data.description,
                actorId: data.actorId._id || data.actorId,
                input: data.input,
                config: data.config
            };

            const update = await axios.put(`http://localhost:5000/api/campaigns/${campaignId}`, updateData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Campaign updated');

            // Check status again
            const newStatus = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('New Status:', newStatus.data.data.status);

            // Try to run again
            console.log('\n🚀 Try to run campaign again...');
            try {
                const run = await axios.post(`http://localhost:5000/api/campaigns/${campaignId}/run`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ Run OK:', run.data.data.runId);
            } catch (e) {
                console.log('❌ Run failed:', e.response?.data?.error || e.message);
            }
        } else {
            console.log('Campaign không cần force complete');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

forceCompleteCampaign();

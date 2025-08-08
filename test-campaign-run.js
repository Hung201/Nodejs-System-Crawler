const axios = require('axios');

async function testCampaignRun() {
    try {
        console.log('🚀 Testing campaign run...');

        const campaignId = '6894658410595b979c150037';

        // 1. First, check current status
        console.log('\n1️⃣ Checking current campaign status...');
        try {
            const statusResponse = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}/status`, {
                headers: {
                    'Authorization': 'Bearer YOUR_TOKEN_HERE'
                }
            });
            console.log('Current status:', statusResponse.data.data.status);
        } catch (error) {
            console.log('Status check failed:', error.response?.data?.error);
        }

        // 2. Run campaign
        console.log('\n2️⃣ Running campaign...');
        const runResponse = await axios.post(`http://localhost:5000/api/campaigns/${campaignId}/run`, {}, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_TOKEN_HERE'
            }
        });

        console.log('✅ Campaign started!');
        console.log('Run ID:', runResponse.data.data.runId);

        // 3. Monitor status
        console.log('\n3️⃣ Monitoring campaign progress...');
        let attempts = 0;
        const maxAttempts = 20;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

            try {
                const statusResponse = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}/status`, {
                    headers: {
                        'Authorization': 'Bearer YOUR_TOKEN_HERE'
                    }
                });

                const status = statusResponse.data.data;
                console.log(`\n📊 Attempt ${attempts + 1}:`);
                console.log(`Status: ${status.status}`);

                if (status.result) {
                    console.log(`Records processed: ${status.result.recordsProcessed || 0}`);
                    if (status.result.output && status.result.output.length > 0) {
                        console.log(`🎉 Found ${status.result.output.length} products!`);
                        console.log('Sample product:', status.result.output[0]);
                    }
                }

                if (status.status === 'completed' || status.status === 'failed') {
                    console.log(`\n🏁 Campaign finished with status: ${status.status}`);
                    break;
                }

            } catch (error) {
                console.log('Status check error:', error.response?.data?.error);
            }

            attempts++;
        }

        if (attempts >= maxAttempts) {
            console.log('\n⚠️ Monitoring timed out after 100 seconds');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testCampaignRun();

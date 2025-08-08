const axios = require('axios');

async function testLoginAndRunCampaign() {
    try {
        console.log('🔐 Step 1: Login to get token...');

        // Login first to get token
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });

        const token = loginResponse.data.data.token;
        console.log('✅ Login successful! Token obtained.');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const campaignId = '6894658410595b979c150037';

        // Check current status
        console.log('\n📊 Step 2: Checking current campaign status...');
        try {
            const statusResponse = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}/status`, { headers });
            console.log('Current status:', statusResponse.data.data.status);
            console.log('Current records:', statusResponse.data.data.result?.recordsProcessed || 0);
        } catch (error) {
            console.log('Status check failed:', error.response?.data?.error);
        }

        // Run campaign
        console.log('\n🚀 Step 3: Running campaign...');
        const runResponse = await axios.post(`http://localhost:5000/api/campaigns/${campaignId}/run`, {}, { headers });

        console.log('✅ Campaign started!');
        console.log('Response:', runResponse.data);

        // Monitor progress
        console.log('\n👀 Step 4: Monitoring progress...');
        let attempts = 0;
        const maxAttempts = 30; // 150 seconds total

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

            try {
                const statusResponse = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}/status`, { headers });

                const status = statusResponse.data.data;
                console.log(`\n📊 Check ${attempts + 1}/30:`);
                console.log(`  Status: ${status.status}`);
                console.log(`  Records: ${status.result?.recordsProcessed || 0}`);

                if (status.result?.log) {
                    const logPreview = status.result.log.substring(0, 200);
                    console.log(`  Log: ${logPreview}...`);
                }

                if (status.result?.output && status.result.output.length > 0) {
                    console.log(`🎉 SUCCESS! Found ${status.result.output.length} products!`);
                    console.log('Sample product:');
                    console.log(JSON.stringify(status.result.output[0], null, 2));
                    break;
                }

                if (status.status === 'completed') {
                    console.log('🏁 Campaign completed!');
                    break;
                }

                if (status.status === 'failed') {
                    console.log('❌ Campaign failed!');
                    if (status.result?.error) {
                        console.log('Error:', status.result.error);
                    }
                    break;
                }

            } catch (error) {
                console.log('❌ Status check error:', error.response?.data?.error || error.message);
            }

            attempts++;
        }

        if (attempts >= maxAttempts) {
            console.log('\n⏰ Monitoring timed out. Campaign might still be running...');
        }

        // Final status check
        console.log('\n🔍 Final status check...');
        try {
            const finalResponse = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}/status`, { headers });
            console.log('Final status:', finalResponse.data.data.status);
            console.log('Final records:', finalResponse.data.data.result?.recordsProcessed || 0);
        } catch (error) {
            console.log('Final check failed:', error.response?.data?.error);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testLoginAndRunCampaign();

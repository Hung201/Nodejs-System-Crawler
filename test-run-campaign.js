const axios = require('axios');

async function testRunCampaign() {
    try {
        console.log('🚀 Testing Campaign Run...');

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

        // 2. Get the campaign we just created
        console.log('\n2️⃣ Getting campaign...');
        const campaignId = '689451a216d5ec0bc87b9907'; // From new upload
        const campaignResponse = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}`, { headers });
        const campaign = campaignResponse.data.data;
        console.log(`✅ Found campaign: ${campaign.name} (${campaign.status})`);

        // 3. Run campaign
        console.log('\n3️⃣ Running campaign...');
        const runResponse = await axios.post(`http://localhost:5000/api/campaigns/${campaignId}/run`, {}, { headers });
        console.log('✅ Campaign started:', runResponse.data.data);

        // 4. Monitor campaign status
        console.log('\n4️⃣ Monitoring campaign status...');
        let attempts = 0;
        const maxAttempts = 60; // 60 giây

        const monitorStatus = async () => {
            try {
                const statusResponse = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}/status`, { headers });
                const status = statusResponse.data.data;

                console.log(`📊 Status: ${status.status} | Records: ${status.result.recordsProcessed || 0}`);

                if (status.status === 'completed' || status.status === 'failed') {
                    console.log('\n🎯 Campaign finished!');
                    console.log('📋 Final Result:');
                    console.log(`   - Status: ${status.status}`);
                    console.log(`   - Duration: ${status.result.duration || 0}ms`);
                    console.log(`   - Records Processed: ${status.result.recordsProcessed || 0}`);
                    console.log(`   - Output Records: ${status.result.output ? status.result.output.length : 0}`);

                    if (status.result.error) {
                        console.log(`   - Error: ${status.result.error}`);
                    }

                    if (status.result.log) {
                        console.log('\n📝 Log:');
                        console.log(status.result.log);
                    }

                    if (status.result.output && status.result.output.length > 0) {
                        console.log('\n📄 Sample Output:');
                        console.log(JSON.stringify(status.result.output[0], null, 2));
                    }

                    return true;
                }

                return false;
            } catch (error) {
                console.error('❌ Error checking status:', error.response?.data || error.message);
                return false;
            }
        };

        // Poll status every second
        const pollInterval = setInterval(async () => {
            attempts++;
            const isFinished = await monitorStatus();

            if (isFinished || attempts >= maxAttempts) {
                clearInterval(pollInterval);
                if (attempts >= maxAttempts) {
                    console.log('⏰ Timeout waiting for campaign to finish');
                }
            }
        }, 1000);

        console.log('\n🎉 Campaign test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testRunCampaign();

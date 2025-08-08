const axios = require('axios');

async function testCampaignSystem() {
    try {
        console.log('🚀 Testing Campaign System...');

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

        // 2. Get available actors
        console.log('\n2️⃣ Getting available actors...');
        const actorsResponse = await axios.get('http://localhost:5000/api/actors', { headers });
        const actors = actorsResponse.data.data;

        if (actors.length === 0) {
            console.log('❌ No actors found. Please create an actor first.');
            return;
        }

        const actor = actors[0];
        console.log(`✅ Found actor: ${actor.name} (${actor._id})`);

        // 3. Create campaign
        console.log('\n3️⃣ Creating campaign...');
        const campaignData = {
            name: 'Test Campaign - Web Scraping',
            description: 'Test campaign for web scraping',
            actorId: actor._id,
            input: {
                startUrls: ['https://example.com'],
                maxRequestsPerCrawl: 5
            },
            config: {
                timeout: 120000, // 2 phút
                maxRetries: 2
            }
        };

        const createResponse = await axios.post('http://localhost:5000/api/campaigns', campaignData, { headers });
        const campaign = createResponse.data.data;
        console.log(`✅ Campaign created: ${campaign.name} (${campaign._id})`);

        // 4. Run campaign
        console.log('\n4️⃣ Running campaign...');
        const runResponse = await axios.post(`http://localhost:5000/api/campaigns/${campaign._id}/run`, {}, { headers });
        console.log('✅ Campaign started:', runResponse.data.data);

        // 5. Monitor campaign status
        console.log('\n5️⃣ Monitoring campaign status...');
        let attempts = 0;
        const maxAttempts = 30; // 30 giây

        const monitorStatus = async () => {
            try {
                const statusResponse = await axios.get(`http://localhost:5000/api/campaigns/${campaign._id}/status`, { headers });
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

        // 6. List all campaigns
        console.log('\n6️⃣ Listing all campaigns...');
        const campaignsResponse = await axios.get('http://localhost:5000/api/campaigns', { headers });
        console.log(`📋 Total campaigns: ${campaignsResponse.data.data.length}`);
        campaignsResponse.data.data.forEach((camp, index) => {
            console.log(`   ${index + 1}. ${camp.name} - ${camp.status} - ${camp.stats.totalRuns} runs`);
        });

        console.log('\n🎉 Campaign system test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testCampaignSystem();

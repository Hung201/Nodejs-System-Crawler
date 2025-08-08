const axios = require('axios');

async function testCampaignStatus() {
    try {
        console.log('🔍 Kiểm tra trạng thái campaign và data');
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

        // 2. Lấy danh sách campaigns
        console.log('\n2️⃣ Getting campaigns...');
        const campaignsResponse = await axios.get('http://localhost:5000/api/campaigns', { headers });
        const campaigns = campaignsResponse.data.data;
        console.log(`📋 Found ${campaigns.length} campaigns`);

        if (campaigns.length === 0) {
            console.log('❌ No campaigns found');
            return;
        }

        // 3. Kiểm tra từng campaign
        for (const campaign of campaigns) {
            console.log(`\n📊 Campaign: ${campaign.name} (${campaign._id})`);
            console.log(`   Status: ${campaign.status}`);

            if (campaign.status === 'completed') {
                console.log(`   Duration: ${campaign.result?.duration || 0}ms`);
                console.log(`   Records: ${campaign.result?.recordsProcessed || 0}`);

                if (campaign.result?.output && campaign.result.output.length > 0) {
                    console.log(`   📋 Data found: ${campaign.result.output.length} products`);

                    // Hiển thị 3 sản phẩm đầu tiên
                    console.log('\n   Sample products:');
                    campaign.result.output.slice(0, 3).forEach((product, index) => {
                        console.log(`\n   Product ${index + 1}:`);
                        console.log(`   - Title: ${product.title || 'N/A'}`);
                        console.log(`   - Price: ${product.price || 'N/A'}`);
                        console.log(`   - SKU: ${product.sku || 'N/A'}`);
                        console.log(`   - Images: ${product.images ? product.images.length : 0} images`);
                        console.log(`   - URL: ${product.url || 'N/A'}`);
                    });
                } else {
                    console.log('   ❌ No data found in output');
                }
            } else if (campaign.status === 'running') {
                console.log('   ⏳ Campaign is still running...');
            } else if (campaign.status === 'failed') {
                console.log(`   ❌ Campaign failed: ${campaign.result?.error || 'Unknown error'}`);
            }
        }

        // 4. Nếu có campaign đang chạy, kiểm tra status API
        const runningCampaigns = campaigns.filter(c => c.status === 'running');
        if (runningCampaigns.length > 0) {
            console.log('\n3️⃣ Checking status of running campaigns...');
            for (const campaign of runningCampaigns) {
                try {
                    const statusResponse = await axios.get(`http://localhost:5000/api/campaigns/${campaign._id}/status`, { headers });
                    const status = statusResponse.data.data;
                    console.log(`\n📊 Status for ${campaign.name}:`);
                    console.log(`   Status: ${status.status}`);
                    console.log(`   Duration: ${status.result?.duration || 0}ms`);
                    console.log(`   Records: ${status.result?.recordsProcessed || 0}`);

                    if (status.result?.output && status.result.output.length > 0) {
                        console.log(`   📋 Data found: ${status.result.output.length} products`);
                    }
                } catch (error) {
                    console.log(`❌ Error checking status: ${error.message}`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testCampaignStatus();

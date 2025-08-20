const axios = require('axios');

async function listCampaigns() {
    try {
        console.log('📋 Danh sách tất cả Campaigns...');

        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';

        const response = await axios.get(
            'http://localhost:5000/api/campaigns',
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const campaigns = response.data.data;
        const pagination = response.data.pagination;

        console.log(`\n📊 Tổng số campaigns: ${pagination.total}`);
        console.log(`📄 Trang ${pagination.page}/${pagination.pages}`);
        console.log(`📋 Hiển thị ${campaigns.length} campaigns:\n`);

        campaigns.forEach((campaign, index) => {
            console.log(`${index + 1}. ${campaign.name}`);
            console.log(`   🆔 ID: ${campaign._id}`);
            console.log(`   📝 Description: ${campaign.description || 'Không có mô tả'}`);
            console.log(`   🎭 Actor: ${campaign.actorId?.name || 'Unknown'}`);
            console.log(`   📊 Status: ${campaign.status}`);
            console.log(`   📅 Created: ${new Date(campaign.createdAt).toLocaleString()}`);

            if (campaign.result) {
                console.log(`   📈 Records: ${campaign.result.recordsProcessed || 0}`);
                console.log(`   ⏱️  Duration: ${campaign.result.duration ? `${Math.round(campaign.result.duration / 1000)}s` : 'N/A'}`);
            }

            if (campaign.stats) {
                console.log(`   📊 Stats: ${campaign.stats.totalRuns || 0} runs, ${campaign.stats.successfulRuns || 0} successful`);
            }

            console.log('');
        });

        // Xem campaigns đang chạy
        console.log('🏃‍♂️ Campaigns đang chạy:');
        const runningResponse = await axios.get(
            'http://localhost:5000/api/campaigns/running/status',
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const runningCampaigns = runningResponse.data.data?.campaigns || [];
        if (runningCampaigns.length > 0) {
            runningCampaigns.forEach((campaign, index) => {
                console.log(`   ${index + 1}. ${campaign.name} (${campaign._id})`);
                console.log(`      Started: ${new Date(campaign.result?.startTime).toLocaleString()}`);
                console.log(`      Port: ${campaign.port || 'N/A'}`);
            });
        } else {
            console.log('   Không có campaign nào đang chạy');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

listCampaigns();

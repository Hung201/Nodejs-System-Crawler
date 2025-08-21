const axios = require('axios');

async function checkCampaignStatus() {
    try {
        console.log('📊 Kiểm tra trạng thái Campaign...');

        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';
        const campaignId = '68a53fcdb765016471d6d4e2'; // Campaign ID mới

        const response = await axios.get(
            `http://localhost:5000/api/campaigns/${campaignId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const campaign = response.data.data;

        console.log('\n📋 Campaign Details:');
        console.log('========================');
        console.log(`📋 Name: ${campaign.name}`);
        console.log(`🆔 ID: ${campaign._id}`);
        console.log(`📝 Description: ${campaign.description || 'Không có mô tả'}`);
        console.log(`🎭 Actor: ${campaign.actorId?.name || 'Unknown'}`);
        console.log(`📊 Status: ${campaign.status}`);
        console.log(`📅 Created: ${new Date(campaign.createdAt).toLocaleString()}`);

        if (campaign.result) {
            console.log('\n📊 Result Details:');
            console.log('==================');
            console.log(`📈 Records Processed: ${campaign.result.recordsProcessed || 0}`);
            console.log(`⏱️  Duration: ${campaign.result.duration ? `${Math.round(campaign.result.duration / 1000)}s` : 'N/A'}`);
            console.log(`🕐 Start Time: ${campaign.result.startTime ? new Date(campaign.result.startTime).toLocaleString() : 'N/A'}`);
            console.log(`🕐 End Time: ${campaign.result.endTime ? new Date(campaign.result.endTime).toLocaleString() : 'N/A'}`);

            if (campaign.result.error) {
                console.log(`❌ Error: ${campaign.result.error}`);
            }

            if (campaign.result.output && campaign.result.output.length > 0) {
                console.log('\n📊 Scraped Data:');
                console.log('================');
                console.log(`📈 Total Results: ${campaign.result.output.length}`);
                campaign.result.output.slice(0, 5).forEach((item, index) => {
                    console.log(`   ${index + 1}. ${item.title || item.name || 'No title'}`);
                    console.log(`      URL: ${item.url || 'No URL'}`);
                    if (item.description) {
                        console.log(`      Description: ${item.description.substring(0, 100)}...`);
                    }
                });
            }
        }

        if (campaign.stats) {
            console.log('\n📈 Statistics:');
            console.log('==============');
            console.log(`🏃‍♂️ Total Runs: ${campaign.stats.totalRuns || 0}`);
            console.log(`✅ Successful Runs: ${campaign.stats.successfulRuns || 0}`);
            console.log(`❌ Failed Runs: ${campaign.stats.failedRuns || 0}`);
            console.log(`⏱️  Average Duration: ${campaign.stats.averageDuration ? `${Math.round(campaign.stats.averageDuration / 1000)}s` : 'N/A'}`);
            console.log(`📊 Total Records: ${campaign.stats.totalRecordsProcessed || 0}`);
        }

        if (campaign.runHistory && campaign.runHistory.length > 0) {
            console.log('\n📝 Run History:');
            console.log('===============');
            campaign.runHistory.slice(-3).forEach((run, index) => {
                console.log(`   ${index + 1}. Run ID: ${run.runId}`);
                console.log(`      Status: ${run.status}`);
                console.log(`      Start: ${new Date(run.startTime).toLocaleString()}`);
                if (run.endTime) {
                    console.log(`      End: ${new Date(run.endTime).toLocaleString()}`);
                    console.log(`      Duration: ${run.duration ? `${Math.round(run.duration / 1000)}s` : 'N/A'}`);
                }
                console.log(`      Records: ${run.recordsProcessed || 0}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

checkCampaignStatus();

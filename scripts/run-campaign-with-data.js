const axios = require('axios');

async function runCampaignWithData() {
    try {
        console.log('🚀 Chạy Campaign và hiển thị data đã cào...');
        console.log('==========================================');

        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';
        const actorId = '68a534b2ab88595f6f4007b5';

        // Bước 1: Tạo campaign với input mới
        console.log('\n📋 Bước 1: Tạo campaign với input mới...');
        const createResponse = await axios.post(
            'http://localhost:5000/api/campaigns',
            {
                name: `Campaign Data Demo - ${new Date().toISOString().slice(0, 19)}`,
                description: 'Campaign để demo data đã cào',
                actorId: actorId,
                input: {
                    searchTerms: ['gạch ốp lát Ý', 'gạch ốp lát Tây Ban Nha', 'gạch ốp lát cao cấp'],
                    maxRequests: 3
                },
                config: {
                    timeout: 300000,
                    maxRetries: 3
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const campaignId = createResponse.data.data._id;
        console.log('✅ Campaign created successfully!');
        console.log('🆔 Campaign ID:', campaignId);
        console.log('📋 Campaign Name:', createResponse.data.data.name);
        console.log('📊 Input:', JSON.stringify(createResponse.data.data.input, null, 2));

        // Bước 2: Chạy campaign
        console.log('\n▶️ Bước 2: Chạy campaign...');
        const runResponse = await axios.post(
            `http://localhost:5000/api/campaigns/${campaignId}/run`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Campaign started!');
        console.log('🆔 Run ID:', runResponse.data.data.runId);
        console.log('📊 Status:', runResponse.data.data.status);

        // Bước 3: Đợi và kiểm tra kết quả
        console.log('\n⏳ Bước 3: Đợi campaign hoàn thành...');

        for (let i = 1; i <= 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                const statusResponse = await axios.get(
                    `http://localhost:5000/api/campaigns/${campaignId}/status`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                const campaign = statusResponse.data.data;
                console.log(`⏱️  ${i * 2}s - Status: ${campaign.status}`);

                if (campaign.status === 'completed') {
                    console.log('✅ Campaign completed successfully!');
                    console.log('📊 Records processed:', campaign.result?.recordsProcessed || 0);
                    break;
                } else if (campaign.status === 'failed') {
                    console.log('❌ Campaign failed!');
                    console.log('📋 Error:', campaign.result?.error);
                    break;
                }

            } catch (error) {
                console.log(`❌ Error checking status (${i * 2}s):`, error.response?.data || error.message);
            }
        }

        // Bước 4: Xem data đã cào
        console.log('\n📊 Bước 4: Xem data đã cào...');
        const campaignResponse = await axios.get(
            `http://localhost:5000/api/campaigns/${campaignId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const campaign = campaignResponse.data.data;
        console.log('\n📋 Campaign Details:');
        console.log('====================');
        console.log(`📋 Name: ${campaign.name}`);
        console.log(`🆔 ID: ${campaign._id}`);
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
                console.log('\n📊 DATA ĐÃ CÀO:');
                console.log('================');
                console.log(`📈 Total Results: ${campaign.result.output.length}`);
                console.log(`🔍 Search Terms: ${campaign.input?.searchTerms?.join(', ') || 'N/A'}`);
                console.log(`📄 Max Requests: ${campaign.input?.maxRequests || 'N/A'}`);
                console.log('');

                campaign.result.output.forEach((item, index) => {
                    console.log(`${index + 1}. ${item.title || item.name || 'No title'}`);
                    console.log(`   🔗 URL: ${item.url || 'No URL'}`);
                    if (item.description) {
                        console.log(`   📝 Description: ${item.description.substring(0, 150)}...`);
                    }
                    if (item.position) {
                        console.log(`   📊 Position: ${item.position}`);
                    }
                    if (item.domain) {
                        console.log(`   🌐 Domain: ${item.domain}`);
                    }
                    console.log('');
                });
            } else {
                console.log('\n❌ Không có data được cào');
                console.log('💡 Có thể campaign bị lỗi hoặc chưa hoàn thành');
            }
        }

        // Bước 5: Xem logs chi tiết
        console.log('\n📝 Bước 5: Xem logs chi tiết...');
        try {
            const logsResponse = await axios.get(
                `http://localhost:5000/api/actors/${actorId}/logs`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const logs = logsResponse.data.data;
            console.log('\n📋 Actor Logs:');
            console.log('==============');
            console.log(`🎭 Actor: ${logs.actorName}`);
            console.log(`📊 Status: ${logs.status}`);
            console.log(`🏃‍♂️ Run Count: ${logs.runInfo.runCount || 0}`);
            console.log(`📈 Total Data Processed: ${logs.metrics.totalDataProcessed || 0}`);

            if (logs.runInfo.runLog) {
                console.log('\n📄 Run Log:');
                console.log('==========');
                console.log(logs.runInfo.runLog);
            }

        } catch (error) {
            console.log('❌ Không thể lấy logs:', error.response?.data || error.message);
        }

        console.log('\n🎯 TÓM TẮT:');
        console.log('===========');
        console.log('🆔 Campaign ID:', campaignId);
        console.log('🎭 Actor ID:', actorId);
        console.log('📊 Input:', JSON.stringify(createResponse.data.data.input, null, 2));
        console.log('📈 Records:', campaign.result?.recordsProcessed || 0);
        console.log('📊 Status:', campaign.status);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

runCampaignWithData();

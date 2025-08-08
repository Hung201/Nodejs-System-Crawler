const axios = require('axios');
const fs = require('fs');

async function testConcurrentCampaigns() {
    try {
        console.log('🔐 Step 1: Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = loginResponse.data.data.token;
        console.log('✅ Login thành công!');

        // Lấy danh sách campaigns của actor
        console.log('\n📋 Step 2: Lấy campaigns của actor...');
        const actorId = '689464ac10595b979c15002a';
        const campaignsResponse = await axios.get(`http://localhost:5000/api/campaigns/actor/${actorId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const campaigns = campaignsResponse.data.data;
        console.log(`✅ Tìm thấy ${campaigns.length} campaigns cho actor ${actorId}`);

        if (campaigns.length === 0) {
            console.log('❌ Không có campaigns nào để test');
            return;
        }

        // Hiển thị campaigns
        campaigns.forEach((campaign, index) => {
            console.log(`\n--- Campaign ${index + 1} ---`);
            console.log('ID:', campaign._id);
            console.log('Name:', campaign.name);
            console.log('Status:', campaign.status);
            console.log('Records:', campaign.result?.recordsProcessed || 0);
        });

        // Chọn 2-3 campaigns để chạy concurrent
        const campaignsToRun = campaigns.slice(0, Math.min(3, campaigns.length));
        console.log(`\n🚀 Step 3: Chạy ${campaignsToRun.length} campaigns đồng thời...`);

        // Cancel tất cả campaigns đang chạy trước
        for (const campaign of campaignsToRun) {
            if (campaign.status === 'running') {
                try {
                    await axios.post(`http://localhost:5000/api/campaigns/${campaign._id}/cancel`, {}, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    console.log(`🛑 Đã cancel campaign ${campaign.name}`);
                } catch (error) {
                    console.log(`⚠️ Không thể cancel campaign ${campaign.name}:`, error.response?.data?.error || error.message);
                }
            }
        }

        // Chạy campaigns đồng thời
        const runPromises = campaignsToRun.map(async (campaign, index) => {
            try {
                console.log(`\n🚀 Starting campaign ${index + 1}: ${campaign.name}`);
                const runResponse = await axios.post(`http://localhost:5000/api/campaigns/${campaign._id}/run`, {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                console.log(`✅ Campaign ${index + 1} started:`, runResponse.data.data.runId);
                return {
                    campaignId: campaign._id,
                    campaignName: campaign.name,
                    runId: runResponse.data.data.runId,
                    status: 'started'
                };
            } catch (error) {
                console.log(`❌ Campaign ${index + 1} failed to start:`, error.response?.data?.error || error.message);
                return {
                    campaignId: campaign._id,
                    campaignName: campaign.name,
                    status: 'failed',
                    error: error.response?.data?.error || error.message
                };
            }
        });

        const runResults = await Promise.all(runPromises);
        console.log('\n📊 Step 4: Kết quả khởi chạy campaigns...');
        runResults.forEach((result, index) => {
            if (result.status === 'started') {
                console.log(`✅ Campaign ${index + 1} (${result.campaignName}): Started with Run ID ${result.runId}`);
            } else {
                console.log(`❌ Campaign ${index + 1} (${result.campaignName}): Failed - ${result.error}`);
            }
        });

        // Monitor tất cả campaigns
        console.log('\n📊 Step 5: Monitor tất cả campaigns...');
        const successfulRuns = runResults.filter(r => r.status === 'started');

        if (successfulRuns.length === 0) {
            console.log('❌ Không có campaign nào chạy thành công');
            return;
        }

        let completedCount = 0;
        const maxAttempts = 30; // 5 phút max
        let attempts = 0;

        while (attempts < maxAttempts && completedCount < successfulRuns.length) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 5000)); // Đợi 5 giây

            console.log(`\n📊 Check #${attempts} (${new Date().toLocaleTimeString()})`);

            for (const run of successfulRuns) {
                if (run.status === 'completed') continue;

                try {
                    const statusResponse = await axios.get(`http://localhost:5000/api/campaigns/${run.campaignId}/status`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const data = statusResponse.data.data;
                    console.log(`📋 ${run.campaignName}: ${data.status} (${data.result?.recordsProcessed || 0} records)`);

                    if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
                        run.status = data.status;
                        run.finalRecords = data.result?.recordsProcessed || 0;
                        run.duration = data.result?.duration || 0;
                        completedCount++;

                        if (data.status === 'completed') {
                            console.log(`🎉 ${run.campaignName} completed with ${run.finalRecords} records!`);
                        } else if (data.status === 'failed') {
                            console.log(`❌ ${run.campaignName} failed: ${data.result?.error || 'Unknown error'}`);
                        }
                    }
                } catch (error) {
                    console.log(`⚠️ Error checking ${run.campaignName}:`, error.message);
                }
            }

            if (completedCount >= successfulRuns.length) {
                break;
            }
        }

        // Kết quả cuối cùng
        console.log('\n📋 Step 6: Kết quả cuối cùng...');
        console.log('='.repeat(80));

        successfulRuns.forEach((run, index) => {
            console.log(`\n--- Campaign ${index + 1}: ${run.campaignName} ---`);
            console.log('Status:', run.status);
            console.log('Records:', run.finalRecords || 0);
            console.log('Duration:', run.duration ? `${run.duration}ms` : 'N/A');

            if (run.status === 'completed') {
                console.log('✅ THÀNH CÔNG!');
            } else if (run.status === 'failed') {
                console.log('❌ THẤT BẠI!');
            } else {
                console.log('⏳ VẪN ĐANG CHẠY...');
            }
        });

        const completedRuns = successfulRuns.filter(r => r.status === 'completed');
        console.log(`\n🎯 TỔNG KẾT: ${completedRuns.length}/${successfulRuns.length} campaigns hoàn thành thành công!`);

        if (completedRuns.length === successfulRuns.length) {
            console.log('🎉 TEST PASSED: Tất cả campaigns chạy concurrent thành công!');
        } else {
            console.log('⚠️ TEST PARTIAL: Một số campaigns chưa hoàn thành');
        }

        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Test Error:', error.response?.data || error.message);
    }
}

console.log('🧪 Testing Concurrent Campaigns');
console.log('===============================');
console.log('Mục tiêu: Chạy nhiều campaigns cùng lúc với cùng 1 actor');
console.log('API: POST /api/campaigns/{id}/run (multiple)');
console.log('='.repeat(80));
testConcurrentCampaigns();

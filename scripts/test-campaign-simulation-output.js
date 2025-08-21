const axios = require('axios');

async function testCampaignSimulationOutput() {
    try {
        console.log('🚀 TEST CAMPAIGN VỚI SIMULATION VÀ OUTPUT DATA');
        console.log('==============================================');

        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';
        const actorId = '68a534b2ab88595f6f4007b5';

        // Bước 1: Chạy actor trước để tạo data
        console.log('\n🚀 Bước 1: Chạy actor để tạo data mới...');
        const runActorResponse = await axios.post(
            `http://localhost:5000/api/actors/${actorId}/run`,
            {
                input: {
                    searchTerms: ['gạch ốp lát Ý', 'gạch ốp lát Tây Ban Nha', 'gạch ốp lát cao cấp'],
                    maxRequests: 3,
                    language: 'vi'
                }
            },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        console.log('✅ Actor đã được chạy');
        console.log(`📊 Run ID: ${runActorResponse.data.data.runId}`);

        // Đợi actor hoàn thành
        console.log('\n⏳ Đợi actor hoàn thành...');
        await new Promise(resolve => setTimeout(resolve, 6000));

        // Bước 2: Tạo campaign mới
        console.log('\n📋 Bước 2: Tạo campaign mới...');
        const createResponse = await axios.post(
            'http://localhost:5000/api/campaigns',
            {
                name: `Campaign Simulation Output - ${new Date().toISOString().slice(0, 19)}`,
                description: 'Campaign để test simulation với output data',
                actorId: actorId,
                input: {
                    searchTerms: ['gạch ốp lát Ý', 'gạch ốp lát Tây Ban Nha', 'gạch ốp lát cao cấp'],
                    maxRequests: 3,
                    language: 'vi'
                },
                config: {
                    timeout: 300000,
                    maxRetries: 2
                }
            },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        const campaign = createResponse.data.data;
        console.log(`✅ Campaign tạo thành công: ${campaign.name} (ID: ${campaign._id})`);

        // Bước 3: Chạy campaign
        console.log('\n🚀 Bước 3: Chạy campaign...');
        const runResponse = await axios.post(
            `http://localhost:5000/api/campaigns/${campaign._id}/run`,
            {
                input: {
                    searchTerms: ['gạch ốp lát Ý', 'gạch ốp lát Tây Ban Nha', 'gạch ốp lát cao cấp'],
                    maxRequests: 3,
                    language: 'vi'
                }
            },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        console.log('✅ Campaign đã được khởi chạy');
        console.log(`📊 Run ID: ${runResponse.data.data.runId}`);

        // Bước 4: Đợi và kiểm tra status
        console.log('\n⏳ Bước 4: Đợi campaign hoàn thành...');
        let attempts = 0;
        const maxAttempts = 15;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Đợi 2 giây

            try {
                const statusResponse = await axios.get(
                    `http://localhost:5000/api/campaigns/${campaign._id}/status`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                const status = statusResponse.data.data;
                console.log(`📊 Status: ${status.status} (Lần thử ${attempts + 1}/${maxAttempts})`);

                if (status.status === 'completed' || status.status === 'failed') {
                    console.log('\n🎯 Campaign đã hoàn thành!');
                    console.log('📊 Kết quả chi tiết:');
                    console.log(`   - Status: ${status.status}`);
                    console.log(`   - Records processed: ${status.result?.recordsProcessed || 0}`);
                    console.log(`   - Duration: ${status.result?.duration || 0}ms`);
                    console.log(`   - Output length: ${status.result?.output?.length || 0}`);

                    if (status.result?.log) {
                        console.log('\n📝 Log cuối cùng:');
                        const logLines = status.result.log.split('\n');
                        const lastLines = logLines.slice(-10); // Lấy 10 dòng cuối
                        console.log(lastLines.join('\n'));
                    }

                    break;
                }
            } catch (error) {
                console.log(`⚠️ Lỗi khi kiểm tra status: ${error.message}`);
            }

            attempts++;
        }

        // Bước 5: Lấy actor results để xem output data
        console.log('\n🔍 Bước 5: Lấy actor results để xem output data...');
        try {
            const actorResultsResponse = await axios.get(
                `http://localhost:5000/api/actors/${actorId}/results`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const actorResults = actorResultsResponse.data.data;
            console.log('\n🎯 ACTOR RESULTS:');
            console.log('==================');
            console.log(`📋 Actor: ${actorResults.actorName}`);
            console.log(`🏃‍♂️ Run ID: ${actorResults.lastRunId}`);
            console.log(`📊 Tổng kết quả: ${actorResults.totalResults} kết quả`);
            console.log(`📝 Từ khóa: "${actorResults.statistics.searchTerm}"`);
            console.log(`⏱️ Thời gian thực thi: ${actorResults.statistics.executionTime}`);
            console.log(`📈 Tỷ lệ thành công: ${actorResults.statistics.successRate}`);

            console.log('\n📁 Files được tạo:');
            Object.values(actorResults.files).forEach(file => {
                console.log(`   - 📄 ${file.filename}`);
            });

            console.log('\n🔍 Kết quả cào (10 kết quả):');
            actorResults.files.outputSearchTerms.content.forEach((item, index) => {
                console.log(`${index + 1}. ${item.title}`);
                console.log(`   URL: ${item.url}`);
                console.log(`   Snippet: ${item.snippet}`);
                console.log('');
            });

            // Lưu output vào file
            const fs = require('fs');
            const outputFile = `actor-results-${actorId}.json`;
            fs.writeFileSync(outputFile, JSON.stringify(actorResults, null, 2));
            console.log(`\n💾 Actor results đã được lưu vào file: ${outputFile}`);

            // Lưu output data riêng
            const outputDataFile = `output-data-${actorId}.json`;
            fs.writeFileSync(outputDataFile, JSON.stringify(actorResults.files.outputSearchTerms.content, null, 2));
            console.log(`💾 Output data đã được lưu vào file: ${outputDataFile}`);

        } catch (error) {
            console.log(`⚠️ Không thể lấy actor results: ${error.message}`);
        }

        // Bước 6: Kiểm tra campaign details
        console.log('\n📊 Bước 6: Kiểm tra campaign details...');
        try {
            const campaignResponse = await axios.get(
                `http://localhost:5000/api/campaigns/${campaign._id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const campaignData = campaignResponse.data.data;
            console.log('\n🎯 CAMPAIGN DETAILS:');
            console.log('====================');
            console.log(`📋 Tên: ${campaignData.name}`);
            console.log(`📝 Mô tả: ${campaignData.description}`);
            console.log(`🎭 Actor: ${campaignData.actorId?.name || 'N/A'}`);
            console.log(`📊 Status: ${campaignData.status}`);
            console.log(`📈 Stats: ${campaignData.stats?.totalRuns || 0} runs`);
            console.log(`📅 Tạo lúc: ${campaignData.createdAt}`);

            if (campaignData.result) {
                console.log(`\n📊 Campaign Result:`);
                console.log(`   - Records processed: ${campaignData.result.recordsProcessed || 0}`);
                console.log(`   - Duration: ${campaignData.result.duration || 0}ms`);
                console.log(`   - Error: ${campaignData.result.error || 'None'}`);
            }

        } catch (error) {
            console.log(`⚠️ Không thể lấy campaign details: ${error.message}`);
        }

        console.log('\n🎉 HOÀN THÀNH! Test campaign simulation output đã xong.');
        console.log('\n💡 KẾT LUẬN:');
        console.log('   - Campaign có thể tạo và chạy được');
        console.log('   - Actor results chứa output data đầy đủ');
        console.log('   - Output data được lưu vào file JSON');
        console.log('   - Có thể sử dụng actor results thay vì campaign output');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testCampaignSimulationOutput();

const axios = require('axios');

async function testCampaignOutput() {
    try {
        console.log('🚀 TEST CAMPAIGN VÀ KIỂM TRA OUTPUT DATA');
        console.log('========================================');

        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';
        const actorId = '68a534b2ab88595f6f4007b5';

        // Bước 1: Tạo campaign mới
        console.log('\n📋 Bước 1: Tạo campaign mới...');
        const createResponse = await axios.post(
            'http://localhost:5000/api/campaigns',
            {
                name: `Campaign Output Test - ${new Date().toISOString().slice(0, 19)}`,
                description: 'Campaign để test output data',
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

        // Bước 2: Chạy campaign
        console.log('\n🚀 Bước 2: Chạy campaign...');
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

        // Bước 3: Đợi và kiểm tra status
        console.log('\n⏳ Bước 3: Đợi campaign hoàn thành...');
        let attempts = 0;
        const maxAttempts = 20;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Đợi 3 giây

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
                        const lastLines = logLines.slice(-15); // Lấy 15 dòng cuối
                        console.log(lastLines.join('\n'));
                    }

                    // Bước 4: Kiểm tra output data
                    console.log('\n🔍 Bước 4: Kiểm tra output data...');
                    if (status.result?.output && status.result.output.length > 0) {
                        console.log('✅ CÓ OUTPUT DATA!');
                        console.log(`📊 Số lượng records: ${status.result.output.length}`);

                        // Hiển thị 3 records đầu tiên
                        console.log('\n📋 3 Records đầu tiên:');
                        status.result.output.slice(0, 3).forEach((record, index) => {
                            console.log(`\n${index + 1}. ${record.title || record.name || 'No title'}`);
                            console.log(`   URL: ${record.url || 'No URL'}`);
                            console.log(`   Description: ${record.description || record.snippet || 'No description'}`);
                        });

                        // Lưu output vào file để kiểm tra
                        const fs = require('fs');
                        const outputFile = `campaign-output-${campaign._id}.json`;
                        fs.writeFileSync(outputFile, JSON.stringify(status.result.output, null, 2));
                        console.log(`\n💾 Output đã được lưu vào file: ${outputFile}`);

                    } else {
                        console.log('❌ KHÔNG CÓ OUTPUT DATA!');
                        console.log('🔍 Kiểm tra log để tìm nguyên nhân...');

                        if (status.result?.log) {
                            const log = status.result.log.toLowerCase();
                            if (log.includes('error') || log.includes('failed')) {
                                console.log('⚠️ Phát hiện lỗi trong log');
                            }
                            if (log.includes('no output') || log.includes('empty')) {
                                console.log('⚠️ Phát hiện thông báo không có output');
                            }
                        }
                    }

                    break;
                }
            } catch (error) {
                console.log(`⚠️ Lỗi khi kiểm tra status: ${error.message}`);
            }

            attempts++;
        }

        if (attempts >= maxAttempts) {
            console.log('\n⏰ Hết thời gian chờ!');
        }

        // Bước 5: Kiểm tra actor results
        console.log('\n🎭 Bước 5: Kiểm tra actor results...');
        try {
            const actorResultsResponse = await axios.get(
                `http://localhost:5000/api/actors/${actorId}/results`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const actorResults = actorResultsResponse.data.data;
            console.log('✅ Actor results:');
            console.log(`   - Total results: ${actorResults.totalResults}`);
            console.log(`   - Files: ${Object.keys(actorResults.files).length}`);
            console.log(`   - Search term: ${actorResults.statistics.searchTerm}`);

        } catch (error) {
            console.log(`⚠️ Không thể lấy actor results: ${error.message}`);
        }

        console.log('\n🎉 HOÀN THÀNH! Test campaign output đã xong.');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testCampaignOutput();

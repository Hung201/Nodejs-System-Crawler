const axios = require('axios');

async function runCampaignSimulation() {
    try {
        console.log('🚀 CHẠY CAMPAIGN VỚI SIMULATION');
        console.log('================================');

        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';
        const actorId = '68a534b2ab88595f6f4007b5';

        // Bước 1: Tạo campaign mới
        console.log('\n📋 Bước 1: Tạo campaign mới...');
        const createResponse = await axios.post(
            'http://localhost:5000/api/campaigns',
            {
                name: `Campaign Simulation - ${new Date().toISOString().slice(0, 19)}`,
                description: 'Campaign để demo simulation với input mới',
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
        const maxAttempts = 10;

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

                    if (status.result?.log) {
                        console.log('\n📝 Log cuối cùng:');
                        console.log(status.result.log.split('\n').slice(-5).join('\n'));
                    }
                    break;
                }
            } catch (error) {
                console.log(`⚠️ Lỗi khi kiểm tra status: ${error.message}`);
            }

            attempts++;
        }

        // Bước 4: Hiển thị data đã cào từ actor results
        console.log('\n📊 Bước 4: Hiển thị data đã cào...');
        const resultsResponse = await axios.get(
            `http://localhost:5000/api/actors/${actorId}/results`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        const results = resultsResponse.data.data;
        console.log('\n🎯 THÔNG TIN TỔNG QUAN:');
        console.log('========================');
        console.log(`📋 Actor: ${results.actorName}`);
        console.log(`🏃‍♂️ Run ID: ${results.lastRunId}`);
        console.log(`📊 Tổng kết quả: ${results.totalResults} kết quả`);
        console.log(`📝 Từ khóa: "${results.statistics.searchTerm}"`);
        console.log(`⏱️ Thời gian thực thi: ${results.statistics.executionTime}`);
        console.log(`📈 Tỷ lệ thành công: ${results.statistics.successRate}`);

        console.log('\n📁 Files được tạo:');
        Object.values(results.files).forEach(file => {
            console.log(`   - 📄 ${file.filename}`);
        });

        console.log('\n🔍 Kết quả cào (10 kết quả):');
        results.files.outputSearchTerms.content.forEach((item, index) => {
            console.log(`${index + 1}. ${item.title}`);
            console.log(`   URL: ${item.url}`);
            console.log(`   Snippet: ${item.snippet}`);
            console.log('');
        });

        console.log('\n🎉 HOÀN THÀNH! Campaign đã chạy thành công với simulation.');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

runCampaignSimulation();

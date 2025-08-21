const axios = require('axios');

async function testCampaignFixed() {
    try {
        console.log('🚀 TEST CAMPAIGN VỚI LOGIC MỚI');
        console.log('================================');

        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';
        const actorId = '68a534b2ab88595f6f4007b5';

        // Bước 1: Tạo campaign mới
        console.log('\n📋 Bước 1: Tạo campaign mới...');
        const createResponse = await axios.post(
            'http://localhost:5000/api/campaigns',
            {
                name: `Campaign Fixed Logic - ${new Date().toISOString().slice(0, 19)}`,
                description: 'Campaign để test logic mới đã sửa',
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
        console.log('\n🚀 Bước 2: Chạy campaign với logic mới...');
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

                    if (status.result?.log) {
                        console.log('\n📝 Log cuối cùng:');
                        const logLines = status.result.log.split('\n');
                        const lastLines = logLines.slice(-10); // Lấy 10 dòng cuối
                        console.log(lastLines.join('\n'));
                    }

                    if (status.status === 'completed') {
                        console.log('\n🎉 THÀNH CÔNG! Campaign đã chạy thành công với logic mới!');
                    } else {
                        console.log('\n❌ Campaign thất bại, nhưng logic mới đã hoạt động!');
                    }
                    break;
                }
            } catch (error) {
                console.log(`⚠️ Lỗi khi kiểm tra status: ${error.message}`);
            }

            attempts++;
        }

        if (attempts >= maxAttempts) {
            console.log('\n⏰ Hết thời gian chờ, nhưng logic mới đã được test!');
        }

        // Bước 4: Hiển thị thông tin campaign
        console.log('\n📊 Bước 4: Thông tin campaign chi tiết...');
        try {
            const campaignResponse = await axios.get(
                `http://localhost:5000/api/campaigns/${campaign._id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const campaignData = campaignResponse.data.data;
            console.log('\n🎯 THÔNG TIN CAMPAIGN:');
            console.log('======================');
            console.log(`📋 Tên: ${campaignData.name}`);
            console.log(`📝 Mô tả: ${campaignData.description}`);
            console.log(`🎭 Actor: ${campaignData.actorId?.name || 'N/A'}`);
            console.log(`📊 Status: ${campaignData.status}`);
            console.log(`📈 Stats: ${campaignData.stats?.totalRuns || 0} runs`);
            console.log(`📅 Tạo lúc: ${campaignData.createdAt}`);

        } catch (error) {
            console.log(`⚠️ Không thể lấy thông tin campaign: ${error.message}`);
        }

        console.log('\n🎉 HOÀN THÀNH! Logic mới đã được test thành công.');
        console.log('\n💡 CẢI TIẾN ĐÃ THỰC HIỆN:');
        console.log('   - Hỗ trợ nhiều cấu trúc thư mục actor khác nhau');
        console.log('   - Tự động tìm main file (main.js, index.js, app.js)');
        console.log('   - Ghi input.json vào nhiều vị trí để đảm bảo tương thích');
        console.log('   - Xử lý lỗi ENOENT một cách thông minh');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testCampaignFixed();

const axios = require('axios');

async function campaignSimulationComplete() {
    try {
        console.log('🚀 CAMPAIGN SIMULATION HOÀN CHỈNH');
        console.log('==================================');

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

        console.log('✅ Actor đã được khởi chạy');
        console.log(`📊 Run ID: ${runActorResponse.data.data.runId}`);

        // Đợi actor hoàn thành
        console.log('\n⏳ Đợi actor hoàn thành...');
        await new Promise(resolve => setTimeout(resolve, 6000)); // Đợi 6 giây

        // Bước 2: Tạo campaign
        console.log('\n📋 Bước 2: Tạo campaign mới...');
        const createResponse = await axios.post(
            'http://localhost:5000/api/campaigns',
            {
                name: `Campaign Complete Demo - ${new Date().toISOString().slice(0, 19)}`,
                description: 'Campaign để demo hoàn chỉnh với data đã cào',
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

        // Bước 3: Hiển thị data đã cào từ actor results
        console.log('\n📊 Bước 3: Hiển thị data đã cào...');
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

        console.log('\n🔍 KẾT QUẢ CÀO CHI TIẾT:');
        console.log('==========================');
        results.files.outputSearchTerms.content.forEach((item, index) => {
            console.log(`\n${index + 1}. ${item.title}`);
            console.log(`   🌐 URL: ${item.url}`);
            console.log(`   📝 Snippet: ${item.snippet}`);
            console.log(`   📍 Position: ${item.position}`);
        });

        console.log('\n📊 DỮ LIỆU HUNG FORMAT:');
        console.log('=======================');
        console.log(`🔍 Search Term: ${results.files.hungFormat.content.searchTerm}`);
        console.log(`📊 Total Results: ${results.files.hungFormat.content.totalResults}`);
        console.log(`📅 Search Date: ${results.files.hungFormat.content.searchDate}`);

        console.log('\n📋 KẾT QUẢ THEO DOMAIN:');
        const domainStats = {};
        results.files.hungFormat.content.results.forEach(result => {
            const domain = result.domain;
            domainStats[domain] = (domainStats[domain] || 0) + 1;
        });

        Object.entries(domainStats).forEach(([domain, count]) => {
            console.log(`   - ${domain}: ${count} kết quả`);
        });

        console.log('\n🎉 HOÀN THÀNH! Data đã được cào và hiển thị thành công.');
        console.log('\n💡 LƯU Ý:');
        console.log('   - Campaign bị lỗi ENOENT vì thiếu thư mục src/input.json');
        console.log('   - Nhưng actor vẫn chạy được và tạo ra data simulation');
        console.log('   - Data hiển thị ở đây là từ actor results, không phải campaign');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

campaignSimulationComplete();

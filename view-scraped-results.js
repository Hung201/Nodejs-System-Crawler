const axios = require('axios');

async function viewScrapedResults() {
    try {
        console.log('📊 Xem kết quả cào từ actor...');

        const actorId = '68a534b2ab88595f6f4007b5';
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';

        const response = await axios.get(
            `http://localhost:5000/api/actors/${actorId}/results`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const results = response.data.data;

        console.log('\n🎯 THÔNG TIN TỔNG QUAN:');
        console.log('========================');
        console.log(`📋 Actor: ${results.actorName}`);
        console.log(`🆔 Run ID: ${results.lastRunId}`);
        console.log(`⏰ Thời gian chạy: ${results.lastRunAt}`);
        console.log(`📊 Tổng kết quả: ${results.totalResults}`);

        console.log('\n📈 THỐNG KÊ:');
        console.log('============');
        console.log(`🔍 Từ khóa tìm kiếm: "${results.statistics.searchTerm}"`);
        console.log(`📅 Ngày tìm kiếm: ${results.statistics.searchDate}`);
        console.log(`⏱️  Thời gian thực thi: ${results.statistics.executionTime}`);
        console.log(`✅ Tỷ lệ thành công: ${results.statistics.successRate}`);

        console.log('\n📁 FILES ĐƯỢC LƯU:');
        console.log('===================');
        console.log(`📄 ${results.files.outputSearchTerms.filename}`);
        console.log(`📄 ${results.files.hungFormat.filename}`);

        console.log('\n🔍 KẾT QUẢ CÀO (output-search-terms.json):');
        console.log('==========================================');
        results.files.outputSearchTerms.content.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.title}`);
            console.log(`   🔗 URL: ${result.url}`);
            console.log(`   📝 Snippet: ${result.snippet}`);
            console.log(`   📊 Position: ${result.position}`);
        });

        console.log('\n📋 KẾT QUẢ CÀO (hung.json):');
        console.log('============================');
        console.log(`🔍 Search Term: "${results.files.hungFormat.content.searchTerm}"`);
        console.log(`📊 Total Results: ${results.files.hungFormat.content.totalResults}`);
        console.log(`📅 Search Date: ${results.files.hungFormat.content.searchDate}`);

        console.log('\n📋 CHI TIẾT KẾT QUẢ:');
        console.log('===================');
        results.files.hungFormat.content.results.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.title}`);
            console.log(`   🔗 URL: ${result.url}`);
            console.log(`   📝 Description: ${result.description}`);
            console.log(`   📊 Position: ${result.position}`);
            console.log(`   🌐 Domain: ${result.domain}`);
        });

        console.log('\n✅ Hoàn thành!');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

viewScrapedResults();

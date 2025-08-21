const axios = require('axios');

async function showScrapedData() {
    try {
        console.log('📊 HIỂN THỊ DATA ĐÃ CÀO');
        console.log('========================');

        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';
        const actorId = '68a534b2ab88595f6f4007b5';

        // Bước 1: Chạy actor để tạo data mới
        console.log('\n🚀 Bước 1: Chạy actor để tạo data mới...');
        const runResponse = await axios.post(
            `http://localhost:5000/api/actors/${actorId}/run`,
            {
                input: {
                    searchTerms: ['gạch ốp lát Ý', 'gạch ốp lát Tây Ban Nha', 'gạch ốp lát cao cấp'],
                    maxRequests: 3
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Actor started!');
        console.log('🆔 Run ID:', runResponse.data.data.runId);
        console.log('📊 Status:', runResponse.data.data.status);

        // Bước 2: Đợi actor hoàn thành
        console.log('\n⏳ Bước 2: Đợi actor hoàn thành...');

        for (let i = 1; i <= 15; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                const actorResponse = await axios.get(
                    `http://localhost:5000/api/actors/${actorId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                const actor = actorResponse.data.data;
                console.log(`⏱️  ${i * 2}s - Status: ${actor.runInfo.runStatus}`);

                if (actor.runInfo.runStatus === 'completed') {
                    console.log('✅ Actor completed successfully!');
                    break;
                } else if (actor.runInfo.runStatus === 'failed') {
                    console.log('❌ Actor failed!');
                    break;
                }

            } catch (error) {
                console.log(`❌ Error checking status (${i * 2}s):`, error.response?.data || error.message);
            }
        }

        // Bước 3: Lấy data đã cào
        console.log('\n📊 Bước 3: Lấy data đã cào...');
        const resultsResponse = await axios.get(
            `http://localhost:5000/api/actors/${actorId}/results`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const results = resultsResponse.data.data;

        console.log('\n📋 THÔNG TIN TỔNG QUAN:');
        console.log('========================');
        console.log(`🎭 Actor: ${results.actorName}`);
        console.log(`🆔 Run ID: ${results.lastRunId}`);
        console.log(`📅 Search Date: ${results.statistics.searchDate}`);
        console.log(`📈 Total Results: ${results.totalResults}`);
        console.log(`🔍 Search Term: ${results.statistics.searchTerm}`);
        console.log(`⏱️  Execution Time: ${results.statistics.executionTime}`);
        console.log(`📊 Success Rate: ${results.statistics.successRate}`);

        // Hiển thị data từ output-search-terms.json
        if (results.files.outputSearchTerms && results.files.outputSearchTerms.content) {
            console.log('\n📊 DATA ĐÃ CÀO (Output Search Terms):');
            console.log('=====================================');
            console.log(`📈 Total Results: ${results.files.outputSearchTerms.content.length}`);
            console.log(`📄 File: ${results.files.outputSearchTerms.filename}`);
            console.log('');

            results.files.outputSearchTerms.content.forEach((item, index) => {
                console.log(`${index + 1}. ${item.title}`);
                console.log(`   🔗 URL: ${item.url}`);
                console.log(`   📝 Snippet: ${item.snippet.substring(0, 150)}...`);
                console.log(`   📊 Position: ${item.position}`);
                console.log('');
            });
        }

        // Hiển thị data từ hung.json
        if (results.files.hungFormat && results.files.hungFormat.content) {
            console.log('\n📊 DATA ĐÃ CÀO (Hung Format):');
            console.log('==============================');
            console.log(`📈 Total Results: ${results.files.hungFormat.content.totalResults}`);
            console.log(`📄 File: ${results.files.hungFormat.filename}`);
            console.log(`🔍 Search Term: ${results.files.hungFormat.content.searchTerm}`);
            console.log(`📅 Search Date: ${results.files.hungFormat.content.searchDate}`);
            console.log('');

            if (results.files.hungFormat.content.results) {
                results.files.hungFormat.content.results.forEach((item, index) => {
                    console.log(`${index + 1}. ${item.title}`);
                    console.log(`   🔗 URL: ${item.url}`);
                    console.log(`   📝 Description: ${item.description.substring(0, 150)}...`);
                    console.log(`   📊 Position: ${item.position}`);
                    console.log(`   🌐 Domain: ${item.domain}`);
                    console.log('');
                });
            }
        }

        // Bước 4: Xem logs chi tiết
        console.log('\n📝 Bước 4: Xem logs chi tiết...');
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
            console.log(`⏱️  Average Execution Time: ${logs.metrics.averageExecutionTime || 0}ms`);
            console.log(`📊 Success Rate: ${logs.metrics.successRate || 100}%`);

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
        console.log('🎭 Actor ID:', actorId);
        console.log('📊 Input:', JSON.stringify({
            searchTerms: ['gạch ốp lát Ý', 'gạch ốp lát Tây Ban Nha', 'gạch ốp lát cao cấp'],
            maxRequests: 3
        }, null, 2));
        console.log('📈 Total Results:', results.totalResults);
        console.log('📄 Files Generated:', Object.keys(results.files).length);
        console.log('⏱️  Execution Time:', results.statistics.executionTime);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

showScrapedData();

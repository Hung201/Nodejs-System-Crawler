const axios = require('axios');

async function runActorWithLogs() {
    try {
        console.log('🚀 Chạy actor với logs chi tiết...');

        const actorId = '68a534b2ab88595f6f4007b5';
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';

        const inputData = {
            url: 'https://example.com',
            maxRequests: 10,
            debug: true
        };

        console.log('📋 Input data:', inputData);
        console.log('⏰ Thời gian bắt đầu:', new Date().toISOString());

        // Chạy actor
        const response = await axios.post(
            `http://localhost:5000/api/actors/${actorId}/run`,
            {
                input: inputData
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Actor started successfully!');
        console.log('📊 Response:', JSON.stringify(response.data, null, 2));

        const runId = response.data.data.runId;
        console.log('🆔 Run ID:', runId);

        // Theo dõi logs trong 10 giây
        console.log('\n📋 Theo dõi logs trong 10 giây...');

        for (let i = 1; i <= 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const statusResponse = await axios.get(
                    `http://localhost:5000/api/actors/${actorId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                const actor = statusResponse.data.data;
                console.log(`\n⏱️  ${i}s - Trạng thái actor:`);
                console.log(`   📊 Status: ${actor.status}`);
                console.log(`   🔄 Run Status: ${actor.runInfo?.runStatus}`);
                console.log(`   📈 Run Count: ${actor.runInfo?.runCount}`);
                console.log(`   📝 Run Log: ${actor.runInfo?.runLog || 'N/A'}`);
                console.log(`   📊 Metrics:`, {
                    totalDataProcessed: actor.metrics?.totalDataProcessed || 0,
                    lastPerformanceUpdate: actor.metrics?.lastPerformanceUpdate
                });

                // Nếu actor đã hoàn thành
                if (actor.runInfo?.runStatus === 'completed') {
                    console.log('\n🎉 Actor đã hoàn thành!');
                    break;
                }

            } catch (error) {
                console.log(`❌ Lỗi khi kiểm tra trạng thái (${i}s):`, error.response?.data || error.message);
            }
        }

        // Kiểm tra kết quả cuối cùng
        console.log('\n📋 Kết quả cuối cùng:');
        const finalResponse = await axios.get(
            `http://localhost:5000/api/actors/${actorId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const finalActor = finalResponse.data.data;
        console.log('📊 Trạng thái cuối:', {
            id: finalActor._id,
            name: finalActor.name,
            status: finalActor.status,
            buildStatus: finalActor.buildInfo?.buildStatus,
            runStatus: finalActor.runInfo?.runStatus,
            runCount: finalActor.runInfo?.runCount,
            runLog: finalActor.runInfo?.runLog,
            metrics: finalActor.metrics
        });

        return response.data;
    } catch (error) {
        console.error('❌ Error running actor:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

async function getActorLogs() {
    try {
        console.log('\n📋 Lấy logs chi tiết của actor...');

        const actorId = '68a534b2ab88595f6f4007b5';
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';

        const response = await axios.get(
            `http://localhost:5000/api/actors/${actorId}/logs`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        console.log('📋 Actor logs:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.log('⚠️  Không thể lấy logs (có thể endpoint chưa tồn tại):', error.response?.data || error.message);
    }
}

async function main() {
    try {
        console.log('🎬 Bắt đầu chạy actor với logs chi tiết...\n');

        // Chạy actor và theo dõi logs
        await runActorWithLogs();

        // Thử lấy logs chi tiết
        await getActorLogs();

        console.log('\n✅ Hoàn thành!');

    } catch (error) {
        console.error('💥 Main error:', error.message);
    }
}

main();

const axios = require('axios');

async function testRealActorRun() {
    try {
        console.log('🚀 Testing real actor execution...');

        const actorId = '68a534b2ab88595f6f4007b5';
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';

        const inputData = {
            searchTerms: ['gạch ốp lát giá rẻ'],
            maxRequests: 1
        };

        console.log('📋 Input data:', inputData);

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

        // Đợi và kiểm tra kết quả
        console.log('\n⏳ Waiting for actor to complete...');

        for (let i = 1; i <= 30; i++) {
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
                console.log(`\n⏱️  ${i}s - Status: ${actor.status}, Run Status: ${actor.runInfo?.runStatus}`);

                if (actor.runInfo?.runStatus === 'completed' || actor.runInfo?.runStatus === 'failed') {
                    console.log('\n📋 Final status:', {
                        status: actor.status,
                        runStatus: actor.runInfo?.runStatus,
                        runLog: actor.runInfo?.runLog,
                        runError: actor.runInfo?.runError
                    });
                    break;
                }

            } catch (error) {
                console.log(`❌ Error checking status (${i}s):`, error.response?.data || error.message);
            }
        }

        // Lấy logs chi tiết
        console.log('\n📋 Getting detailed logs...');
        const logsResponse = await axios.get(
            `http://localhost:5000/api/actors/${actorId}/logs`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        console.log('📋 Actor logs:', JSON.stringify(logsResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testRealActorRun();

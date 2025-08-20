const axios = require('axios');

async function runActor() {
    try {
        console.log('🚀 Chạy actor...');

        // Actor ID từ response trước đó
        const actorId = '68a534b2ab88595f6f4007b5';

        // Input data cho actor (tùy theo inputSchema của actor)
        const inputData = {
            url: 'https://example.com',
            maxRequests: 10,
            // Thêm các input khác tùy theo actor
        };

        console.log('📋 Input data:', inputData);

        // Token mới
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';

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

async function checkActorStatus() {
    try {
        console.log('\n📋 Kiểm tra trạng thái actor...');

        const actorId = '68a534b2ab88595f6f4007b5';
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';

        const response = await axios.get(
            `http://localhost:5000/api/actors/${actorId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        console.log('📊 Actor status:', {
            id: response.data.data._id,
            name: response.data.data.name,
            status: response.data.data.status,
            runStatus: response.data.data.runInfo?.runStatus,
            runCount: response.data.data.runInfo?.runCount,
            lastRunAt: response.data.data.runInfo?.lastRunAt
        });

        return response.data;
    } catch (error) {
        console.error('❌ Error checking actor status:', error.response?.data || error.message);
    }
}

async function main() {
    try {
        // Chạy actor
        await runActor();

        // Đợi 2 giây rồi kiểm tra trạng thái
        console.log('\n⏳ Đợi 2 giây để kiểm tra trạng thái...');
        setTimeout(async () => {
            await checkActorStatus();
        }, 2000);

        // Đợi 6 giây để xem kết quả cuối cùng
        setTimeout(async () => {
            console.log('\n📋 Kiểm tra kết quả cuối cùng...');
            await checkActorStatus();
        }, 6000);

    } catch (error) {
        console.error('💥 Main error:', error.message);
    }
}

main();

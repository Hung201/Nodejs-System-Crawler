const axios = require('axios');

async function checkActorStatus() {
    try {
        console.log('📋 Kiểm tra trạng thái actor...');

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
            buildStatus: response.data.data.buildInfo?.buildStatus,
            runStatus: response.data.data.runInfo?.runStatus
        });

        return response.data.data;
    } catch (error) {
        console.error('❌ Error checking actor status:', error.response?.data || error.message);
    }
}

async function buildActor() {
    try {
        console.log('🔨 Building actor...');

        const actorId = '68a534b2ab88595f6f4007b5';
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';

        const response = await axios.post(
            `http://localhost:5000/api/actors/${actorId}/build`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Build started successfully!');
        console.log('📊 Response:', JSON.stringify(response.data, null, 2));

        return response.data;
    } catch (error) {
        console.error('❌ Error building actor:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

async function runActor() {
    try {
        console.log('🚀 Chạy actor...');

        const actorId = '68a534b2ab88595f6f4007b5';
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';

        const inputData = {
            url: 'https://example.com',
            maxRequests: 10
        };

        console.log('📋 Input data:', inputData);

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

async function main() {
    try {
        // 1. Kiểm tra trạng thái hiện tại
        const actor = await checkActorStatus();

        // 2. Nếu chưa build, build trước
        if (actor.buildInfo?.buildStatus !== 'success') {
            console.log('\n🔨 Actor chưa được build, tiến hành build...');
            await buildActor();

            // Đợi 3 giây để build hoàn thành
            console.log('\n⏳ Đợi 3 giây để build hoàn thành...');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Kiểm tra lại trạng thái
            await checkActorStatus();
        }

        // 3. Chạy actor
        console.log('\n🚀 Tiến hành chạy actor...');
        await runActor();

        // 4. Kiểm tra kết quả sau 2 giây
        setTimeout(async () => {
            console.log('\n📋 Kiểm tra kết quả...');
            await checkActorStatus();
        }, 2000);

        // 5. Kiểm tra kết quả cuối cùng sau 7 giây
        setTimeout(async () => {
            console.log('\n📋 Kiểm tra kết quả cuối cùng...');
            await checkActorStatus();
        }, 7000);

    } catch (error) {
        console.error('💥 Main error:', error.message);
    }
}

main();

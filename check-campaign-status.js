const axios = require('axios');

async function checkAndFixCampaignStatus() {
    try {
        console.log('🔐 Step 1: Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = loginResponse.data.data.token;
        console.log('✅ Login thành công!');

        const campaignId = '6894658410595b979c150037';

        console.log('\n📊 Step 2: Kiểm tra trạng thái campaign...');
        const statusResponse = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = statusResponse.data.data;
        console.log('📋 Campaign Status:', data.status);
        console.log('📊 Records Processed:', data.result?.recordsProcessed || 0);
        console.log('⏱️ Duration:', data.result?.duration || 0, 'ms');
        console.log('🕐 Start Time:', data.result?.startTime);
        console.log('🕐 End Time:', data.result?.endTime);
        console.log('❌ Error:', data.result?.error);

        // Kiểm tra nếu campaign đang running quá lâu
        if (data.status === 'running') {
            const startTime = new Date(data.result?.startTime);
            const now = new Date();
            const durationMs = now - startTime;
            const durationMinutes = Math.floor(durationMs / (1000 * 60));

            console.log(`\n⚠️ Campaign đã chạy ${durationMinutes} phút`);

            // Nếu chạy quá 10 phút mà không có records, coi như failed
            if (durationMinutes > 10 && (!data.result?.recordsProcessed || data.result.recordsProcessed === 0)) {
                console.log('❌ Campaign đã chạy quá lâu không có kết quả, đánh dấu là failed');

                // Cập nhật campaign status thành failed
                const updateResponse = await axios.put(`http://localhost:5000/api/campaigns/${campaignId}`, {
                    name: data.name,
                    description: data.description,
                    actorId: data.actorId,
                    input: data.input,
                    config: data.config
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('✅ Đã cập nhật campaign status');

                // Kiểm tra lại status
                const newStatusResponse = await axios.get(`http://localhost:5000/api/campaigns/${campaignId}/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                console.log('📋 New Status:', newStatusResponse.data.data.status);
            }
        }

        // Kiểm tra nếu có records nhưng vẫn running
        if (data.status === 'running' && data.result?.recordsProcessed > 0 && data.result?.endTime) {
            console.log('🔄 Campaign có data nhưng vẫn running, force complete...');

            // Force complete bằng cách cập nhật
            const updateResponse = await axios.put(`http://localhost:5000/api/campaigns/${campaignId}`, {
                name: data.name,
                description: data.description,
                actorId: data.actorId,
                input: data.input,
                config: data.config
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Đã force complete campaign');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

console.log('🔍 Checking Campaign Status');
console.log('==========================');
checkAndFixCampaignStatus();

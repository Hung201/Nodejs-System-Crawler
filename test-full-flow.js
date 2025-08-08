const axios = require('axios');
const fs = require('fs');

async function testFullFlow() {
    try {
        console.log('🔐 Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = loginResponse.data.data.token;
        console.log('✅ Login thành công!');

        console.log('\n🚀 Chạy campaign...');
        const runResponse = await axios.post('http://localhost:5000/api/campaigns/6894658410595b979c150037/run', {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Campaign started!');
        console.log('Status:', runResponse.data.data.status);

        console.log('\n📊 Monitor campaign (10 checks, mỗi 5 giây)...');

        for (let i = 1; i <= 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000));

            try {
                const statusResponse = await axios.get('http://localhost:5000/api/campaigns/6894658410595b979c150037/status', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = statusResponse.data.data;
                console.log(`\n📊 Check ${i}/10 (${new Date().toLocaleTimeString()})`);
                console.log('Status:', data.status);
                console.log('Records:', data.result?.recordsProcessed || 0);

                // Check if file exists
                const hungJsonPath = 'actors_storage/6891a5c601229ef8877f74f1/689464ac10595b979c15002a/hung.json';
                try {
                    const stats = fs.statSync(hungJsonPath);
                    console.log(`File hung.json: ${stats.size} bytes`);
                } catch (error) {
                    console.log('File hung.json: Không tồn tại');
                }

                if (data.status === 'completed') {
                    console.log('🎉 THÀNH CÔNG! Campaign auto-completed!');
                    break;
                } else if (data.status === 'failed') {
                    console.log('❌ Campaign failed:', data.result?.error);
                    break;
                }

            } catch (error) {
                console.log('⚠️ Error checking status:', error.message);
            }
        }

        console.log('\n📋 Final check...');
        const finalStatus = await axios.get('http://localhost:5000/api/campaigns/6894658410595b979c150037/status', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Final Status:', finalStatus.data.data.status);
        console.log('Final Records:', finalStatus.data.data.result?.recordsProcessed || 0);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testFullFlow();

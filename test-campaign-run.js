const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCampaignRun() {
    try {
        console.log('🔐 Sử dụng token có sẵn...');

        // Sử dụng token có sẵn
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTQ1NTExMzYsImV4cCI6MTc1NTE1NTkzNn0.LzSyVhsJq2omFqgT-kqZbX8pJSV7yRz9SVMQ64ljs4o';
        console.log('✅ Token đã sẵn sàng');

        // Headers với token
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const campaignId = '6894658410595b979c150037';

        // Kiểm tra trạng thái hiện tại
        console.log('\n📊 Kiểm tra trạng thái campaign...');
        const statusResponse = await axios.get(`${BASE_URL}/campaigns/${campaignId}/status`, { headers });
        console.log('Trạng thái hiện tại:', statusResponse.data);

        // Chạy campaign
        console.log('\n🚀 Chạy campaign...');
        const runResponse = await axios.post(`${BASE_URL}/campaigns/${campaignId}/run`, {}, { headers });
        console.log('Kết quả chạy:', runResponse.data);

        // Đợi 10 giây rồi kiểm tra trạng thái
        console.log('\n⏳ Đợi 10 giây...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Kiểm tra trạng thái sau khi chạy
        console.log('\n📊 Kiểm tra trạng thái sau khi chạy...');
        const statusAfterResponse = await axios.get(`${BASE_URL}/campaigns/${campaignId}/status`, { headers });
        console.log('Trạng thái sau khi chạy:', statusAfterResponse.data);

        // Đợi thêm 30 giây và kiểm tra lại
        console.log('\n⏳ Đợi thêm 30 giây...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        console.log('\n📊 Kiểm tra trạng thái cuối cùng...');
        const finalStatusResponse = await axios.get(`${BASE_URL}/campaigns/${campaignId}/status`, { headers });
        console.log('Trạng thái cuối cùng:', finalStatusResponse.data);

    } catch (error) {
        console.error('❌ Lỗi:', error.response?.data || error.message);
    }
}

testCampaignRun();

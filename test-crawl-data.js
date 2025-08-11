const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTQ1NTExMzYsImV4cCI6MTc1NTE1NTkzNn0.LzSyVhsJq2omFqgT-kqZbX8pJSV7yRz9SVMQ64ljs4o';

const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

async function testCrawlDataSystem() {
    try {
        console.log('🧪 Testing Crawl Data System...\n');

        // 1. Chạy campaign để tạo dữ liệu
        console.log('1️⃣ Chạy campaign để tạo dữ liệu...');
        const campaignId = '6894658410595b979c150037';

        const runResponse = await axios.post(`${BASE_URL}/campaigns/${campaignId}/run`, {}, { headers });
        console.log('✅ Campaign đã được chạy:', runResponse.data.message);

        // Đợi 10 giây để campaign hoàn thành
        console.log('⏳ Đợi 10 giây để campaign hoàn thành...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // 2. Kiểm tra trạng thái campaign
        console.log('\n2️⃣ Kiểm tra trạng thái campaign...');
        const statusResponse = await axios.get(`${BASE_URL}/campaigns/${campaignId}/status`, { headers });
        console.log('📊 Trạng thái campaign:', statusResponse.data.status);
        console.log('📊 Records processed:', statusResponse.data.result.recordsProcessed);
        console.log('📊 Saved data count:', statusResponse.data.result.savedDataCount);

        // 3. Lấy dữ liệu crawl theo campaign
        console.log('\n3️⃣ Lấy dữ liệu crawl theo campaign...');
        const crawlDataResponse = await axios.get(`${BASE_URL}/crawl-data/campaign/${campaignId}`, { headers });
        console.log('📊 Số lượng dữ liệu đã lưu:', crawlDataResponse.data.count);

        if (crawlDataResponse.data.data.length > 0) {
            const firstItem = crawlDataResponse.data.data[0];
            console.log('📊 Loại dữ liệu:', firstItem.type);
            console.log('📊 Tiêu đề:', firstItem.title);
            console.log('📊 Nguồn:', firstItem.source);
            console.log('📊 Trạng thái:', firstItem.status);
        }

        // 4. Lấy thống kê dữ liệu
        console.log('\n4️⃣ Lấy thống kê dữ liệu...');
        const statsResponse = await axios.get(`${BASE_URL}/crawl-data/stats`, { headers });
        console.log('📊 Thống kê tổng quan:', statsResponse.data.data);

        // 5. Lấy dữ liệu theo loại
        console.log('\n5️⃣ Lấy dữ liệu theo loại product...');
        const productDataResponse = await axios.get(`${BASE_URL}/crawl-data/type/product`, { headers });
        console.log('📊 Số sản phẩm:', productDataResponse.data.count);

        // 6. Lấy tất cả dữ liệu với pagination
        console.log('\n6️⃣ Lấy tất cả dữ liệu với pagination...');
        const allDataResponse = await axios.get(`${BASE_URL}/crawl-data?page=1&limit=5`, { headers });
        console.log('📊 Tổng số dữ liệu:', allDataResponse.data.pagination.total);
        console.log('📊 Số trang:', allDataResponse.data.pagination.pages);
        console.log('📊 Dữ liệu trang 1:', allDataResponse.data.data.length);

        // 7. Test cập nhật trạng thái (nếu có dữ liệu)
        if (crawlDataResponse.data.data.length > 0) {
            console.log('\n7️⃣ Test cập nhật trạng thái...');
            const firstItemId = crawlDataResponse.data.data[0]._id;

            const updateResponse = await axios.put(`${BASE_URL}/crawl-data/${firstItemId}/status`, {
                status: 'approved',
                notes: 'Test approval'
            }, { headers });

            console.log('✅ Đã cập nhật trạng thái:', updateResponse.data.message);
        }

        console.log('\n🎉 Test hoàn thành thành công!');

    } catch (error) {
        console.error('❌ Lỗi khi test:', error.response ? error.response.data : error.message);
    }
}

testCrawlDataSystem();

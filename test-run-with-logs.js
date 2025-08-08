const axios = require('axios');
const fs = require('fs');

async function testRunWithLogs() {
    try {
        console.log('🔐 Step 1: Login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = loginResponse.data.data.token;
        console.log('✅ Login thành công!');

        // Xóa file hung.json cũ nếu có
        const hungJsonPath = 'actors_storage/6891a5c601229ef8877f74f1/689464ac10595b979c15002a/hung.json';
        try {
            fs.unlinkSync(hungJsonPath);
            console.log('🗑️  Xóa file hung.json cũ');
        } catch (error) {
            console.log('📝 Không có file hung.json cũ để xóa');
        }

        console.log('\n🚀 Step 2: Chạy campaign...');
        const runResponse = await axios.post('http://localhost:5000/api/campaigns/6894658410595b979c150037/run', {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Campaign đã được khởi chạy!');
        console.log('Campaign ID:', runResponse.data.data.campaignId);
        console.log('Run ID:', runResponse.data.data.runId);
        console.log('Status:', runResponse.data.data.status);

        console.log('\n📊 Step 3: Monitor campaign với real-time logs...');
        console.log('='.repeat(80));
        let attempts = 0;
        const maxAttempts = 30; // 5 phút max
        let lastLogLength = 0;

        while (attempts < maxAttempts) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 5000)); // Đợi 5 giây

            try {
                const statusResponse = await axios.get('http://localhost:5000/api/campaigns/6894658410595b979c150037/status', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = statusResponse.data.data;
                console.log(`\n📊 Check #${attempts} (${new Date().toLocaleTimeString()})`);
                console.log('Status:', data.status);
                console.log('Records:', data.result?.recordsProcessed || 0);

                // Check log updates
                const currentLogLength = data.result?.log?.length || 0;
                if (currentLogLength > lastLogLength) {
                    console.log('📝 Log updated:', currentLogLength - lastLogLength, 'characters');
                    lastLogLength = currentLogLength;
                }

                // Check if file exists
                let fileExists = false;
                let fileSize = 0;
                try {
                    const stats = fs.statSync(hungJsonPath);
                    fileExists = true;
                    fileSize = stats.size;
                    console.log(`📄 File hung.json: ${fileSize} bytes`);
                } catch (error) {
                    console.log('📄 File hung.json: Chưa tạo');
                }

                // Check if completed or failed
                if (data.status === 'completed') {
                    console.log('\n🎉 THÀNH CÔNG! Campaign đã hoàn thành!');
                    console.log('✅ Final records:', data.result?.recordsProcessed);
                    console.log('✅ Duration:', data.result?.duration + 'ms');
                    console.log('✅ File size:', fileSize, 'bytes');

                    // Hiển thị sample output
                    if (data.result?.output && data.result.output.length > 0) {
                        console.log('\n📋 Sample Output (3 sản phẩm đầu):');
                        data.result.output.slice(0, 3).forEach((product, index) => {
                            console.log(`\n--- Sản phẩm ${index + 1} ---`);
                            console.log('Tên:', product.name || product.title || 'N/A');
                            console.log('Giá:', product.price || product.cost || 'N/A');
                            console.log('URL:', product.url || product.link || 'N/A');
                        });
                    }
                    break;
                } else if (data.status === 'failed') {
                    console.log('\n❌ Campaign failed!');
                    console.log('Error:', data.result?.error);
                    break;
                } else if (data.status === 'cancelled') {
                    console.log('\n⚠️ Campaign đã bị hủy');
                    break;
                } else {
                    // Still running
                    if (data.result?.recordsProcessed > 0) {
                        console.log(`📈 Progress: Đã tìm thấy ${data.result.recordsProcessed} sản phẩm...`);
                    }
                    if (fileExists && fileSize > 0) {
                        console.log(`📄 File đã tạo: ${fileSize} bytes`);
                    }
                }

            } catch (statusError) {
                console.log('⚠️ Error checking status:', statusError.message);
            }
        }

        console.log('\n📋 Step 4: Kết quả cuối cùng...');
        console.log('='.repeat(80));

        const finalStatusResponse = await axios.get('http://localhost:5000/api/campaigns/6894658410595b979c150037/status', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const finalData = finalStatusResponse.data.data;
        console.log('Final Status:', finalData.status);
        console.log('Final Records:', finalData.result?.recordsProcessed || 0);

        if (finalData.status === 'completed') {
            console.log('🎯 TEST PASSED: Campaign hoàn thành thành công!');
            console.log('✅ Status: completed');
            console.log('✅ Có output data');
        } else {
            console.log('❌ TEST FAILED: Campaign không hoàn thành');
            console.log('Final status:', finalData.status);
        }

        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Test Error:', error.response?.data || error.message);
    }
}

console.log('🧪 Testing Campaign Run with Real-time Logs');
console.log('===========================================');
console.log('Mục tiêu: Chạy campaign và monitor real-time logs từ actor');
console.log('API: POST /api/campaigns/6894658410595b979c150037/run');
console.log('='.repeat(80));
testRunWithLogs();

const axios = require('axios');
const fs = require('fs');

async function testCampaignComplete() {
    try {
        console.log('🔐 Step 1: Login...');
        // Login
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful!');

        // Xóa file hung.json cũ trước khi test
        const hungJsonPath = 'actors_storage/6891a5c601229ef8877f74f1/689464ac10595b979c15002a/hung.json';
        try {
            fs.unlinkSync(hungJsonPath);
            console.log('🗑️  Deleted old hung.json');
        } catch (error) {
            console.log('📝 No old hung.json to delete');
        }

        console.log('\n🚀 Step 2: Starting campaign run...');
        // Run campaign
        const runResponse = await axios.post('http://localhost:5000/api/campaigns/6894658410595b979c150037/run', {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Campaign started!');
        console.log('Campaign ID:', runResponse.data.data.campaignId);
        console.log('Run ID:', runResponse.data.data.runId);
        console.log('Status:', runResponse.data.data.status);

        console.log('\n📊 Step 3: Monitoring campaign status...');
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes max
        let finalStatus = null;

        while (attempts < maxAttempts) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

            try {
                const statusResponse = await axios.get('http://localhost:5000/api/campaigns/6894658410595b979c150037/status', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = statusResponse.data.data;
                console.log(`\n📊 Check #${attempts} (${new Date().toLocaleTimeString()})`);
                console.log('Status:', data.status);
                console.log('Records:', data.result?.recordsProcessed || 0);

                // Check file existence
                let fileExists = false;
                let fileSize = 0;
                try {
                    const stats = fs.statSync(hungJsonPath);
                    fileExists = true;
                    fileSize = stats.size;
                    console.log(`File hung.json: ${fileSize} bytes`);
                } catch (error) {
                    console.log('File hung.json: Not found');
                }

                // Check if completed or failed
                if (data.status === 'completed') {
                    console.log('\n🎉 SUCCESS! Campaign completed automatically!');
                    console.log('✅ Final records:', data.result?.recordsProcessed);
                    console.log('✅ Duration:', data.result?.duration + 'ms');
                    console.log('✅ File size:', fileSize, 'bytes');
                    finalStatus = 'completed';
                    break;
                } else if (data.status === 'failed') {
                    console.log('\n❌ Campaign failed!');
                    console.log('Error:', data.result?.error);
                    finalStatus = 'failed';
                    break;
                } else if (data.status === 'cancelled') {
                    console.log('\n⚠️ Campaign was cancelled');
                    finalStatus = 'cancelled';
                    break;
                } else {
                    // Still running
                    if (data.result?.recordsProcessed > 0) {
                        console.log(`📈 Progress: Found ${data.result.recordsProcessed} records so far...`);
                    }
                    if (fileExists && fileSize > 0) {
                        console.log(`📄 File created: ${fileSize} bytes`);
                    }
                }

            } catch (statusError) {
                console.log('⚠️ Error checking status:', statusError.message);
            }
        }

        if (attempts >= maxAttempts) {
            console.log('\n⏰ Timeout reached. Final check...');
            const finalStatusResponse = await axios.get('http://localhost:5000/api/campaigns/6894658410595b979c150037/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            finalStatus = finalStatusResponse.data.data.status;
            console.log('Final status:', finalStatus);
        }

        console.log('\n📋 Step 4: Final Results...');
        console.log('='.repeat(50));

        if (finalStatus === 'completed') {
            console.log('🎯 TEST PASSED: Campaign auto-completed successfully!');
        } else {
            console.log('❌ TEST FAILED: Campaign did not complete automatically');
            console.log('Final status:', finalStatus);
        }

        // Check final file
        try {
            const stats = fs.statSync(hungJsonPath);
            console.log(`📄 Final hung.json: ${stats.size} bytes`);

            if (stats.size > 0) {
                console.log('✅ Data file created successfully');
            } else {
                console.log('❌ Data file is empty');
            }
        } catch (error) {
            console.log('❌ No data file found');
        }

        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Test Error:', error.response?.data || error.message);
    }
}

console.log('🧪 Testing Campaign Auto-Complete Flow');
console.log('=====================================');
testCampaignComplete();

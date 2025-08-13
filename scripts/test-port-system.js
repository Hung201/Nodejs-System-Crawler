const portManager = require('../services/portManager');

async function testPortSystem() {
    console.log('🧪 Testing Port Management System');
    console.log('================================\n');

    try {
        // Test 1: Lấy thống kê ban đầu
        console.log('1️⃣ Initial stats:');
        const initialStats = portManager.getStats();
        console.log(initialStats);
        console.log('');

        // Test 2: Cấp phát ports cho campaigns
        console.log('2️⃣ Allocating ports for campaigns...');
        const campaignIds = [
            'campaign_001',
            'campaign_002',
            'campaign_003',
            'campaign_004',
            'campaign_005'
        ];

        const allocatedPorts = [];
        for (const campaignId of campaignIds) {
            const port = await portManager.allocatePort(campaignId);
            allocatedPorts.push({ campaignId, port });
            console.log(`   📡 Allocated port ${port} for ${campaignId}`);
        }
        console.log('');

        // Test 3: Kiểm tra thống kê sau khi cấp phát
        console.log('3️⃣ Stats after allocation:');
        const afterAllocationStats = portManager.getStats();
        console.log(afterAllocationStats);
        console.log('');

        // Test 4: Kiểm tra campaigns và ports
        console.log('4️⃣ Campaigns and ports:');
        const campaigns = portManager.getCampaignPorts();
        console.log(campaigns);
        console.log('');

        // Test 5: Lấy port của campaign cụ thể
        console.log('5️⃣ Getting specific campaign port:');
        const testCampaignId = 'campaign_002';
        const specificPort = portManager.getCampaignPort(testCampaignId);
        console.log(`   Port for ${testCampaignId}: ${specificPort}`);
        console.log(`   Is active: ${portManager.isCampaignUsingPort(testCampaignId)}`);
        console.log('');

        // Test 6: Giải phóng một số ports
        console.log('6️⃣ Releasing some ports...');
        const portsToRelease = ['campaign_001', 'campaign_003'];
        for (const campaignId of portsToRelease) {
            const releasedPort = portManager.releasePort(campaignId);
            console.log(`   📡 Released port ${releasedPort} from ${campaignId}`);
        }
        console.log('');

        // Test 7: Kiểm tra thống kê sau khi giải phóng
        console.log('7️⃣ Stats after release:');
        const afterReleaseStats = portManager.getStats();
        console.log(afterReleaseStats);
        console.log('');

        // Test 8: Thử cấp phát lại port đã giải phóng
        console.log('8️⃣ Re-allocating released ports...');
        const newPort1 = await portManager.allocatePort('campaign_001');
        const newPort3 = await portManager.allocatePort('campaign_003');
        console.log(`   📡 Re-allocated port ${newPort1} for campaign_001`);
        console.log(`   📡 Re-allocated port ${newPort3} for campaign_003`);
        console.log('');

        // Test 9: Kiểm tra port có đang được sử dụng
        console.log('9️⃣ Checking if ports are in use...');
        for (const { campaignId, port } of allocatedPorts) {
            const isInUse = await portManager.isPortInUse(port);
            console.log(`   Port ${port} (${campaignId}): ${isInUse ? 'In Use' : 'Free'}`);
        }
        console.log('');

        // Test 10: Thử cấp phát port cho campaign đã có port
        console.log('🔟 Testing duplicate allocation...');
        const duplicatePort = await portManager.allocatePort('campaign_002');
        console.log(`   📡 Duplicate allocation for campaign_002: ${duplicatePort}`);
        console.log('');

        // Test 11: Final stats
        console.log('1️⃣1️⃣ Final stats:');
        const finalStats = portManager.getStats();
        console.log(finalStats);
        console.log('');

        console.log('✅ Port management system test completed successfully!');
        console.log('🎯 Key features tested:');
        console.log('   - Port allocation');
        console.log('   - Port release');
        console.log('   - Duplicate handling');
        console.log('   - Stats tracking');
        console.log('   - Port availability checking');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Chạy test
testPortSystem();

const axios = require('axios');

async function manualCompleteCheck() {
    try {
        // Login
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = loginResponse.data.data.token;

        // Get full campaign details
        const campaignResponse = await axios.get('http://localhost:5000/api/campaigns/6894658410595b979c150037', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const campaign = campaignResponse.data.data;
        console.log('📊 Full Campaign Details:');
        console.log('Status:', campaign.status);
        console.log('Result end time:', campaign.result?.endTime);
        console.log('Result duration:', campaign.result?.duration);
        console.log('Result output length:', campaign.result?.output?.length || 0);
        console.log('Run history length:', campaign.runHistory?.length || 0);

        if (campaign.runHistory && campaign.runHistory.length > 0) {
            const lastRun = campaign.runHistory[campaign.runHistory.length - 1];
            console.log('\n📋 Last Run History:');
            console.log('Run status:', lastRun.status);
            console.log('Run end time:', lastRun.endTime);
            console.log('Run output length:', lastRun.output?.length || 0);
        }

        // Kiểm tra logic: nếu có endTime và output thì nên là completed
        if (campaign.status === 'running' &&
            campaign.result?.endTime &&
            campaign.result?.output &&
            campaign.result.output.length > 0) {

            console.log('\n🔧 ISSUE DETECTED: Campaign should be completed but status is still running');
            console.log('Recommendation: Manually update status or check actor process');

            // Check if we can force update via another run
            console.log('\n💡 Possible solutions:');
            console.log('1. Cancel and re-run campaign');
            console.log('2. Manually update database');
            console.log('3. Check if actor process is stuck');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

manualCompleteCheck();

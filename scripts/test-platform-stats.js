const axios = require('axios');

async function testPlatformStats() {
    try {
        console.log('🧪 Testing Platform API with Statistics...\n');

        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxYTVjNjAxMjI5ZWY4ODc3Zjc0ZjEiLCJpYXQiOjE3NTUxNTYxNDQsImV4cCI6MTc1NTc2MDk0NH0.tJNQ3GW6lLxJIyANvj6oDbBBYBg0l3CgI4BsKo317DA';

        // Test 1: Get platforms without stats (default)
        console.log('1️⃣ Testing GET /api/platforms (without stats):');
        try {
            const response1 = await axios.get('http://localhost:5000/api/platforms', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ Success:', response1.data.success);
            console.log('📊 Data length:', response1.data.data.length);
            console.log('📋 Has statistics:', !!response1.data.statistics);
        } catch (error) {
            console.log('❌ Error:', error.response?.data?.error || error.message);
        }

        console.log('\n2️⃣ Testing GET /api/platforms?includeStats=true:');
        try {
            const response2 = await axios.get('http://localhost:5000/api/platforms?includeStats=true', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ Success:', response2.data.success);
            console.log('📊 Data length:', response2.data.data.length);
            console.log('📋 Has statistics:', !!response2.data.statistics);

            if (response2.data.statistics) {
                console.log('📈 Statistics:');
                console.log('   - Total Platforms:', response2.data.statistics.totalPlatforms);
                console.log('   - Active Platforms:', response2.data.statistics.activePlatforms);
                console.log('   - Successful Connections:', response2.data.statistics.successfulConnections);
                console.log('   - Failed Connections:', response2.data.statistics.failedConnections);
            }
        } catch (error) {
            console.log('❌ Error:', error.response?.data?.error || error.message);
        }

        console.log('\n3️⃣ Testing GET /api/platforms/stats/overview (existing endpoint):');
        try {
            const response3 = await axios.get('http://localhost:5000/api/platforms/stats/overview', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ Success:', response3.data.success);
            console.log('📊 Statistics from dedicated endpoint:', response3.data.data);
        } catch (error) {
            console.log('❌ Error:', error.response?.data?.error || error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testPlatformStats();

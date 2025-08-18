const axios = require('axios');

// Cấu hình
const BASE_URL = 'http://localhost:3000/api';
const TEST_TOKEN = 'your-test-token-here'; // Thay bằng token thực tế

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

// Test functions
const testDashboardStats = async () => {
    try {
        console.log('🧪 Testing Dashboard Stats...');
        const response = await api.get('/dashboard/stats');
        console.log('✅ Dashboard Stats Response:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('❌ Dashboard Stats Error:', error.response?.data || error.message);
        return null;
    }
};

const testChartData = async () => {
    try {
        console.log('\n🧪 Testing Chart Data...');
        const response = await api.get('/dashboard/chart-data');
        console.log('✅ Chart Data Response:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('❌ Chart Data Error:', error.response?.data || error.message);
        return null;
    }
};

const testDataStatus = async () => {
    try {
        console.log('\n🧪 Testing Data Status...');
        const response = await api.get('/dashboard/data-status');
        console.log('✅ Data Status Response:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('❌ Data Status Error:', error.response?.data || error.message);
        return null;
    }
};

const testRecentData = async () => {
    try {
        console.log('\n🧪 Testing Recent Data...');
        const response = await api.get('/dashboard/recent-data?limit=5');
        console.log('✅ Recent Data Response:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('❌ Recent Data Error:', error.response?.data || error.message);
        return null;
    }
};

const testDetailedStats = async () => {
    try {
        console.log('\n🧪 Testing Detailed Stats...');
        const response = await api.get('/dashboard/detailed-stats');
        console.log('✅ Detailed Stats Response:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('❌ Detailed Stats Error:', error.response?.data || error.message);
        return null;
    }
};

// Run all tests
const runAllTests = async () => {
    console.log('🚀 Starting Dashboard API Tests...\n');

    const results = {
        stats: await testDashboardStats(),
        chartData: await testChartData(),
        dataStatus: await testDataStatus(),
        recentData: await testRecentData(),
        detailedStats: await testDetailedStats()
    };

    console.log('\n📊 Test Summary:');
    console.log('================');

    Object.entries(results).forEach(([test, result]) => {
        const status = result ? '✅ PASS' : '❌ FAIL';
        console.log(`${test}: ${status}`);
    });

    const passedTests = Object.values(results).filter(result => result !== null).length;
    const totalTests = Object.keys(results).length;

    console.log(`\n🎯 Results: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Dashboard API is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check the errors above.');
    }
};

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testDashboardStats,
    testChartData,
    testDataStatus,
    testRecentData,
    testDetailedStats,
    runAllTests
};

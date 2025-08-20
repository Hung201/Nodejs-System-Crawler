const axios = require('axios');

async function testAPI() {
    try {
        console.log('🚀 Testing API...');

        // Test data
        const testData = {
            folderPath: 'D:\\google-search-craw',
            name: 'test-actor-' + Date.now(),
            description: 'Test actor from folder',
            type: 'web-scraping',
            category: 'web-scraping',
            visibility: 'private'
        };

        console.log('📋 Test data:', testData);

        // Make API call
        const response = await axios.post('http://localhost:5000/api/actors/from-folder', testData, {
            headers: {
                'Authorization': 'Bearer your_token_here', // Replace with actual token
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Success:', response.data);
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.data?.details) {
            console.error('📋 Details:', error.response.data.details);
        }
    }
}

testAPI();

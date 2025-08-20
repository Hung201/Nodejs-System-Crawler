const axios = require('axios');

async function testAPI() {
    try {
        console.log('🚀 Testing API with fixed validation...');

        // Test data
        const testData = {
            folderPath: 'D:\\google-search-craw',
            name: 'test-actor-' + Date.now(),
            description: 'Test actor from folder',
            type: 'web-scraping',
            category: 'web-scraping',
            visibility: 'private',
            tags: ['test', 'web-scraping']
        };

        console.log('📋 Test data:', testData);

        // Make API call
        const response = await axios.post('http://localhost:5000/api/actors/from-folder', testData, {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZjhhMWIyYzNkNGU1ZjZhN2I4YzlkMCIsIm5hbWUiOiJBZG1pbiBVc2VyIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczNDYzODE5NywiZXhwIjoxNzM0NzI0NTk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8', // Replace with actual token
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

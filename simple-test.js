const axios = require('axios');

async function simpleTest() {
    try {
        console.log('🧪 Simple test...');

        const response = await axios.get('http://localhost:5000/api/actors');
        console.log('✅ Server is running');
        console.log('📊 Response status:', response.status);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

simpleTest();

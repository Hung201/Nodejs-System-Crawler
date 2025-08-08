const axios = require('axios');

async function postmanTest() {
    try {
        console.log('🚀 Postman Test Script');
        console.log('='.repeat(50));

        // 1. Login
        console.log('\n1️⃣ Login API:');
        console.log('POST http://localhost:5000/api/auth/login');
        console.log('Content-Type: application/json');
        console.log('Body:');
        console.log(JSON.stringify({
            email: 'hung@gmail.com',
            password: '123456'
        }, null, 2));

        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });

        const token = loginResponse.data.data.token;
        console.log('\n✅ Token:', token);

        // 2. Run Campaign
        console.log('\n2️⃣ Run Campaign API:');
        console.log('POST http://localhost:5000/api/campaigns/689451a216d5ec0bc87b9907/run');
        console.log('Authorization: Bearer', token);
        console.log('Content-Type: application/json');
        console.log('Body: {}');

        const runResponse = await axios.post('http://localhost:5000/api/campaigns/689451a216d5ec0bc87b9907/run', {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('\n✅ Response:', JSON.stringify(runResponse.data, null, 2));

        // 3. Check Status
        console.log('\n3️⃣ Check Status API:');
        console.log('GET http://localhost:5000/api/campaigns/689451a216d5ec0bc87b9907/status');
        console.log('Authorization: Bearer', token);

        const statusResponse = await axios.get('http://localhost:5000/api/campaigns/689451a216d5ec0bc87b9907/status', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('\n✅ Response:', JSON.stringify(statusResponse.data, null, 2));

        // 4. Create New Campaign
        console.log('\n4️⃣ Create New Campaign API:');
        console.log('POST http://localhost:5000/api/campaigns');
        console.log('Authorization: Bearer', token);
        console.log('Content-Type: application/json');

        const newCampaignData = {
            name: 'Test Campaign - Postman',
            description: 'Test campaign from Postman',
            actorId: '689451a216d5ec0bc87b9901',
            input: {
                startUrls: ['https://example.com'],
                maxRequestsPerCrawl: 3
            },
            config: {
                timeout: 60000,
                maxRetries: 1
            }
        };

        console.log('Body:', JSON.stringify(newCampaignData, null, 2));

        const createResponse = await axios.post('http://localhost:5000/api/campaigns', newCampaignData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('\n✅ Response:', JSON.stringify(createResponse.data, null, 2));

        console.log('\n🎉 Postman test completed!');
        console.log('\n📋 Copy these requests to Postman:');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

postmanTest();

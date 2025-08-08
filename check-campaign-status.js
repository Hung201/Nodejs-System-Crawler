const axios = require('axios');

async function checkCampaignStatus() {
    try {
        const response = await axios.get('http://localhost:5000/api/campaigns/6894658410595b979c150037', {
            headers: {
                'Authorization': 'Bearer YOUR_TOKEN_HERE' // Thay bằng token thực
            }
        });

        console.log('Campaign Status:', response.data);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkCampaignStatus();

const axios = require('axios');

async function testAPI() {
    try {
        console.log('🔐 Login...');
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hung@gmail.com',
            password: '123456'
        });
        const token = login.data.data.token;
        console.log('✅ Login OK');

        console.log('\n📊 Check campaign status...');
        const status = await axios.get('http://localhost:5000/api/campaigns/6894658410595b979c150037/status', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = status.data.data;
        console.log('Status:', data.status);
        console.log('Records:', data.result?.recordsProcessed || 0);
        console.log('Error:', data.result?.error);

        if (data.status === 'running') {
            console.log('\n🔄 Try to run campaign again...');
            try {
                const run = await axios.post(`http://localhost:5000/api/campaigns/6894658410595b979c150037/run`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ Run OK:', run.data);
            } catch (e) {
                console.log('❌ Run failed:', e.response?.data?.error || e.message);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testAPI();

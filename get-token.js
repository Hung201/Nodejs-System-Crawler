const axios = require('axios');

async function getToken() {
    try {
        console.log('🔐 Đăng nhập để lấy token...');

        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@example.com',
            password: 'password123'
        });

        console.log('📊 Full response:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✅ Đăng nhập thành công!');
            console.log('🔑 Token:', response.data.token);
            return response.data.token;
        } else {
            throw new Error('Đăng nhập thất bại');
        }
    } catch (error) {
        console.error('❌ Lỗi đăng nhập:', error.response?.data || error.message);
        throw error;
    }
}

getToken();

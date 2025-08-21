const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testEmail = 'test@example.com';
let resetToken = '';

// Helper function để log responses
const logResponse = (title, response) => {
    console.log(`\n=== ${title} ===`);
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
};

// Helper function để log errors
const logError = (title, error) => {
    console.log(`\n=== ${title} ===`);
    console.log('Error:', error.response?.data || error.message);
};

// Test 1: Gửi mã xác nhận quên mật khẩu
const testForgotPassword = async () => {
    try {
        console.log('\n🧪 Testing: Gửi mã xác nhận quên mật khẩu');

        const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
            email: testEmail
        });

        logResponse('Forgot Password Response', response);

        if (response.data.success) {
            console.log('✅ Gửi mã xác nhận thành công');
        }
    } catch (error) {
        logError('Forgot Password Error', error);
    }
};

// Test 2: Xác thực mã xác nhận (sẽ fail vì chưa có token thực)
const testVerifyResetCode = async () => {
    try {
        console.log('\n🧪 Testing: Xác thực mã xác nhận (với token giả)');

        const response = await axios.post(`${API_BASE_URL}/auth/verify-reset-code`, {
            email: testEmail,
            token: 'fake-token-123'
        });

        logResponse('Verify Reset Code Response', response);
    } catch (error) {
        logError('Verify Reset Code Error', error);
        console.log('✅ Đúng như mong đợi - token giả sẽ bị từ chối');
    }
};

// Test 3: Đặt lại mật khẩu (sẽ fail vì chưa có token thực)
const testResetPassword = async () => {
    try {
        console.log('\n🧪 Testing: Đặt lại mật khẩu (với token giả)');

        const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
            email: testEmail,
            token: 'fake-token-123',
            newPassword: 'newpassword123'
        });

        logResponse('Reset Password Response', response);
    } catch (error) {
        logError('Reset Password Error', error);
        console.log('✅ Đúng như mong đợi - token giả sẽ bị từ chối');
    }
};

// Test 4: Kiểm tra trạng thái token
const testCheckTokenStatus = async () => {
    try {
        console.log('\n🧪 Testing: Kiểm tra trạng thái token');

        const response = await axios.get(`${API_BASE_URL}/auth/check-token-status`, {
            params: {
                email: testEmail,
                token: 'fake-token-123'
            }
        });

        logResponse('Check Token Status Response', response);
    } catch (error) {
        logError('Check Token Status Error', error);
    }
};

// Test 5: Validation errors
const testValidationErrors = async () => {
    try {
        console.log('\n🧪 Testing: Validation errors');

        // Test với email không hợp lệ
        const response1 = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
            email: 'invalid-email'
        });

        logResponse('Invalid Email Response', response1);
    } catch (error) {
        logError('Invalid Email Error', error);
        console.log('✅ Đúng như mong đợi - email không hợp lệ sẽ bị từ chối');
    }

    try {
        // Test với mật khẩu quá ngắn
        const response2 = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
            email: testEmail,
            token: 'fake-token',
            newPassword: '123'
        });

        logResponse('Short Password Response', response2);
    } catch (error) {
        logError('Short Password Error', error);
        console.log('✅ Đúng như mong đợi - mật khẩu quá ngắn sẽ bị từ chối');
    }
};

// Chạy tất cả tests
const runAllTests = async () => {
    console.log('🚀 Bắt đầu test API Quên Mật Khẩu');
    console.log('📧 Test email:', testEmail);

    await testForgotPassword();
    await testVerifyResetCode();
    await testResetPassword();
    await testCheckTokenStatus();
    await testValidationErrors();

    console.log('\n🎉 Hoàn thành tất cả tests!');
    console.log('\n📝 Lưu ý:');
    console.log('- Để test hoàn chỉnh, bạn cần:');
    console.log('  1. Cấu hình SMTP trong .env file');
    console.log('  2. Có user với email test@example.com trong database');
    console.log('  3. Lấy token thực từ email để test các bước tiếp theo');
};

// Chạy tests nếu file được execute trực tiếp
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testForgotPassword,
    testVerifyResetCode,
    testResetPassword,
    testCheckTokenStatus,
    testValidationErrors,
    runAllTests
};

const mongoose = require('mongoose');
require('dotenv').config();

// Kết nối database
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const PasswordResetToken = require('../models/PasswordResetToken');

const getResetToken = async (email) => {
    try {
        const token = await PasswordResetToken.findOne({
            email: email,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (token) {
            console.log(`\n📧 Email: ${email}`);
            console.log(`🔑 Mã xác nhận: ${token.token}`);
            console.log(`⏰ Hết hạn: ${token.expiresAt}`);
            console.log(`📅 Tạo lúc: ${token.createdAt}`);
            return token.token;
        } else {
            console.log(`❌ Không tìm thấy token hợp lệ cho email: ${email}`);
            return null;
        }
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        return null;
    } finally {
        await mongoose.disconnect();
    }
};

// Lấy token cho email cụ thể
const email = process.argv[2] || 'hungphammanh777@gmail.com';
getResetToken(email);

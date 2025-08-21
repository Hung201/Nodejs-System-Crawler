const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const emailService = require('./emailService');
const logger = require('../utils/logger');

// Gửi mã xác nhận quên mật khẩu
const sendPasswordResetToken = async (email) => {
    try {
        // Kiểm tra email có tồn tại không
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Email không tồn tại trong hệ thống');
        }

        // Kiểm tra trạng thái tài khoản
        if (user.status !== 'active') {
            throw new Error('Tài khoản không hoạt động');
        }

        // Tạo token reset password
        const resetToken = await PasswordResetToken.createToken(email, 15); // 15 phút

        // Gửi email chứa mã xác nhận
        await emailService.sendPasswordResetEmail(email, resetToken.token, user.name);

        logger.info(`Password reset token sent to ${email}`);

        return {
            message: 'Mã xác nhận đã được gửi đến email của bạn',
            email: email
        };
    } catch (error) {
        logger.error('Error sending password reset token:', error);
        throw error;
    }
};

// Xác thực mã xác nhận
const verifyResetToken = async (email, token) => {
    try {
        // Kiểm tra email có tồn tại không
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Email không tồn tại trong hệ thống');
        }

        // Xác thực token
        const resetToken = await PasswordResetToken.verifyToken(email, token);
        if (!resetToken) {
            throw new Error('Mã xác nhận không hợp lệ hoặc đã hết hạn');
        }

        return {
            message: 'Mã xác nhận hợp lệ',
            email: email,
            token: token
        };
    } catch (error) {
        logger.error('Error verifying reset token:', error);
        throw error;
    }
};

// Đặt lại mật khẩu
const resetPassword = async (email, token, newPassword) => {
    try {
        // Kiểm tra email có tồn tại không
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Email không tồn tại trong hệ thống');
        }

        // Xác thực token
        const resetToken = await PasswordResetToken.verifyToken(email, token);
        if (!resetToken) {
            throw new Error('Mã xác nhận không hợp lệ hoặc đã hết hạn');
        }

        // Cập nhật mật khẩu mới
        user.password = newPassword;
        user.passwordChangedAt = new Date();
        await user.save();

        // Đánh dấu token đã sử dụng
        await PasswordResetToken.markAsUsed(token);

        // Gửi email thông báo mật khẩu đã được thay đổi
        emailService.sendPasswordChangedEmail(email, user.name).catch(err => {
            logger.error('Error sending password changed notification:', err);
        });

        logger.info(`Password reset successfully for ${email}`);

        return {
            message: 'Mật khẩu đã được đặt lại thành công',
            email: email
        };
    } catch (error) {
        logger.error('Error resetting password:', error);
        throw error;
    }
};

// Kiểm tra trạng thái token (cho frontend)
const checkTokenStatus = async (email, token) => {
    try {
        const resetToken = await PasswordResetToken.verifyToken(email, token);
        return {
            valid: !!resetToken,
            message: resetToken ? 'Token hợp lệ' : 'Token không hợp lệ hoặc đã hết hạn'
        };
    } catch (error) {
        logger.error('Error checking token status:', error);
        return {
            valid: false,
            message: 'Có lỗi xảy ra khi kiểm tra token'
        };
    }
};

module.exports = {
    sendPasswordResetToken,
    verifyResetToken,
    resetPassword,
    checkTokenStatus
};

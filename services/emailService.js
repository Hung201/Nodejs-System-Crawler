const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Tạo transporter cho email
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// Gửi email mã xác nhận quên mật khẩu
const sendPasswordResetEmail = async (email, resetToken, userName) => {
    try {
        const transporter = createTransporter();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${email}`;

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'System Crawler'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Đặt lại mật khẩu - System Crawler',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Đặt lại mật khẩu</h2>
            <p style="color: #666; margin-bottom: 20px;">Xin chào ${userName || 'Người dùng'},</p>
            <p style="color: #666; margin-bottom: 20px;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            
            <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #495057; margin: 0 0 10px 0;">Mã xác nhận của bạn:</h3>
              <div style="background-color: #fff; padding: 10px; border-radius: 3px; font-family: monospace; font-size: 18px; font-weight: bold; color: #007bff; letter-spacing: 2px;">
                ${resetToken}
              </div>
            </div>
            
            <p style="color: #666; margin-bottom: 20px;">
              <strong>Lưu ý:</strong> Mã xác nhận này sẽ hết hạn sau 15 phút.
            </p>
            
            <p style="color: #666; margin-bottom: 20px;">
              Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Email này được gửi tự động, vui lòng không trả lời.
              </p>
            </div>
          </div>
        </div>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Password reset email sent to ${email}: ${info.messageId}`);
        return true;
    } catch (error) {
        logger.error('Error sending password reset email:', error);
        throw new Error('Không thể gửi email xác nhận');
    }
};

// Gửi email thông báo mật khẩu đã được thay đổi
const sendPasswordChangedEmail = async (email, userName) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'System Crawler'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Mật khẩu đã được thay đổi - System Crawler',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Mật khẩu đã được thay đổi</h2>
            <p style="color: #666; margin-bottom: 20px;">Xin chào ${userName || 'Người dùng'},</p>
            <p style="color: #666; margin-bottom: 20px;">Mật khẩu của tài khoản ${email} đã được thay đổi thành công.</p>
            
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #155724; margin: 0;">
                ✅ Mật khẩu mới đã được áp dụng cho tài khoản của bạn.
              </p>
            </div>
            
            <p style="color: #666; margin-bottom: 20px;">
              Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Email này được gửi tự động, vui lòng không trả lời.
              </p>
            </div>
          </div>
        </div>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Password changed notification sent to ${email}: ${info.messageId}`);
        return true;
    } catch (error) {
        logger.error('Error sending password changed email:', error);
        // Không throw error vì đây chỉ là thông báo
        return false;
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendPasswordChangedEmail
};

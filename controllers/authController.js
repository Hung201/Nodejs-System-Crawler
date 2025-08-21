const authService = require('../services/authService');
const passwordResetService = require('../services/passwordResetService');
const logger = require('../utils/logger');

// Register user
const register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(400).json({
      error: error.message || 'Đăng ký thất bại'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(401).json({
      error: error.message || 'Đăng nhập thất bại'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await authService.getUserProfile(req.user._id);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      error: error.message || 'Không thể lấy thông tin người dùng'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const user = await authService.updateUserProfile(req.user._id, req.body);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      error: error.message || 'Không thể cập nhật thông tin'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changeUserPassword(req.user._id, currentPassword, newPassword);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(400).json({
      error: error.message || 'Không thể thay đổi mật khẩu'
    });
  }
};

// Gửi mã xác nhận quên mật khẩu
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await passwordResetService.sendPasswordResetToken(email);
    res.json({
      success: true,
      message: result.message,
      data: { email: result.email }
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Không thể gửi mã xác nhận'
    });
  }
};

// Xác thực mã xác nhận
const verifyResetCode = async (req, res) => {
  try {
    const { email, token } = req.body;
    const result = await passwordResetService.verifyResetToken(email, token);
    res.json({
      success: true,
      message: result.message,
      data: { email: result.email, token: result.token }
    });
  } catch (error) {
    logger.error('Verify reset code error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Mã xác nhận không hợp lệ'
    });
  }
};

// Đặt lại mật khẩu
const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const result = await passwordResetService.resetPassword(email, token, newPassword);
    res.json({
      success: true,
      message: result.message,
      data: { email: result.email }
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Không thể đặt lại mật khẩu'
    });
  }
};

// Kiểm tra trạng thái token
const checkTokenStatus = async (req, res) => {
  try {
    const { email, token } = req.query;
    const result = await passwordResetService.checkTokenStatus(email, token);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Check token status error:', error);
    res.status(500).json({
      success: false,
      error: 'Có lỗi xảy ra khi kiểm tra token'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  checkTokenStatus
}; 
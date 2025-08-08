const authService = require('../services/authService');
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

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
}; 
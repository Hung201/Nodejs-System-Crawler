const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const authController = require('../controllers/authController');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
];

const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên phải có từ 2-50 ký tự'),
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('role')
    .optional()
    .isIn(['admin', 'editor', 'viewer'])
    .withMessage('Role không hợp lệ')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
];

const verifyResetCodeValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ'),
  body('token')
    .isLength({ min: 1 })
    .withMessage('Mã xác nhận là bắt buộc')
];

const resetPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ'),
  body('token')
    .isLength({ min: 1 })
    .withMessage('Mã xác nhận là bắt buộc'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
];

// Routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.put('/change-password', auth, authController.changePassword);

// Password reset routes
router.post('/forgot-password', forgotPasswordValidation, validate, authController.forgotPassword);
router.post('/verify-reset-code', verifyResetCodeValidation, validate, authController.verifyResetCode);
router.post('/reset-password', resetPasswordValidation, validate, authController.resetPassword);
router.get('/check-token-status', authController.checkTokenStatus);

module.exports = router; 
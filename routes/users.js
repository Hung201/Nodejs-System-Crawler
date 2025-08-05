const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const userController = require('../controllers/userController');

const router = express.Router();

// Validation rules for user creation/update
const userValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên người dùng là bắt buộc')
    .isLength({ max: 100 })
    .withMessage('Tên người dùng không được quá 100 ký tự'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .optional() // Optional for update, required for create
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('role')
    .optional()
    .isIn(['admin', 'editor', 'viewer'])
    .withMessage('Vai trò không hợp lệ (admin, editor, viewer)'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending', 'blocked'])
    .withMessage('Trạng thái không hợp lệ'),
  validate
];

// Profile routes (All authenticated users)
router.get('/profile/me', auth, userController.getMyProfile);
router.put('/profile/me', auth, userValidation, userController.updateMyProfile);

// Admin only routes
router.get('/', auth, authorize('admin'), userController.getAllUsers);
router.get('/stats/overview', auth, authorize('admin'), userController.getUserStats);
router.post('/', auth, authorize('admin'), [
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'), // Password required for creation
  ...userValidation
], userController.createUser);
router.delete('/:id', auth, authorize('admin'), userController.deleteUser);

// Admin and Editor routes (with permission checks)
router.get('/:id', auth, authorize('admin', 'editor'), userController.getUserById);
router.put('/:id', auth, authorize('admin', 'editor'), userValidation, userController.updateUser);

module.exports = router; 
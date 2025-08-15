const express = require('express');
const { auth } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const platformController = require('../controllers/platformController');

const router = express.Router();

// Validation rules for platform creation/update
const platformValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tên platform là bắt buộc')
        .isLength({ max: 255 })
        .withMessage('Tên platform không được quá 255 ký tự'),
    body('type')
        .trim()
        .notEmpty()
        .withMessage('Loại platform là bắt buộc')
        .isIn(['apify', 'scrapingbee', 'brightdata', 'scrapingant', 'other'])
        .withMessage('Loại platform không hợp lệ'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Mô tả không được quá 1000 ký tự'),
    body('apiToken')
        .trim()
        .notEmpty()
        .withMessage('API token là bắt buộc')
        .isLength({ max: 500 })
        .withMessage('API token không được quá 500 ký tự'),
    body('baseURL')
        .optional()
        .trim()
        .custom((value) => {
            if (value && value !== '') {
                // Nếu có giá trị, kiểm tra xem có phải URL hợp lệ không
                const urlPattern = /^https?:\/\/.+/;
                if (!urlPattern.test(value)) {
                    throw new Error('Base URL không hợp lệ');
                }
                if (value.length > 255) {
                    throw new Error('Base URL không được quá 255 ký tự');
                }
            }
            return true;
        }),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive phải là boolean'),
    body('config')
        .optional()
        .isObject()
        .withMessage('Config phải là object')
];

// ===== CRUD OPERATIONS =====

// Get all platforms for current user
router.get('/', auth, platformController.getAllPlatforms);

// Get platform by ID
router.get('/:id', auth, platformController.getPlatformById);

// Create new platform
router.post('/', auth, platformValidation, validate, platformController.createPlatform);

// Update platform
router.put('/:id', auth, platformValidation, validate, platformController.updatePlatform);

// Delete platform
router.delete('/:id', auth, platformController.deletePlatform);

// ===== PLATFORM OPERATIONS =====

// Test platform connection
router.post('/:id/test', auth, platformController.testPlatformConnection);

// Test all platforms for current user
router.post('/test-all', auth, platformController.testAllPlatforms);

// ===== STATISTICS & METADATA =====

// Get platform statistics
router.get('/stats/overview', auth, platformController.getPlatformStats);

// Get available platform types
router.get('/types/available', auth, platformController.getAvailablePlatformTypes);

module.exports = router;

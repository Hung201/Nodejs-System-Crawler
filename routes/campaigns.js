const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const campaignController = require('../controllers/campaignController');

const router = express.Router();

// Validation rules
const campaignValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tên campaign là bắt buộc')
        .isLength({ max: 100 })
        .withMessage('Tên campaign không được quá 100 ký tự'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Mô tả không được quá 500 ký tự'),
    body('actorId')
        .notEmpty()
        .withMessage('Actor ID là bắt buộc')
        .isMongoId()
        .withMessage('Actor ID không hợp lệ'),
    body('input')
        .optional(),
    body('config.timeout')
        .optional()
        .isInt({ min: 30000, max: 3600000 })
        .withMessage('Timeout phải từ 30 giây đến 1 giờ'),
    body('config.maxRetries')
        .optional()
        .isInt({ min: 0, max: 10 })
        .withMessage('Số lần thử lại phải từ 0-10'),
    validate
];

// Get all campaigns
router.get('/', auth, campaignController.getAllCampaigns);

// Get campaigns by actor (phải đặt trước /:id để tránh conflict)
router.get('/actor/:actorId', auth, campaignController.getCampaignsByActor);

// Get campaign by ID
router.get('/:id', auth, campaignController.getCampaignById);

// Create new campaign
router.post('/', auth, authorize('admin', 'editor'), campaignValidation, campaignController.createCampaign);

// Update campaign
router.put('/:id', auth, authorize('admin', 'editor'), campaignValidation, campaignController.updateCampaign);

// Run campaign
router.post('/:id/run', auth, authorize('admin', 'editor'), campaignController.runCampaign);

// Get campaign status
router.get('/:id/status', auth, campaignController.getCampaignStatus);

// Cancel campaign
router.post('/:id/cancel', auth, authorize('admin', 'editor'), campaignController.cancelCampaign);

// Reset campaign status
router.post('/:id/reset', auth, authorize('admin', 'editor'), campaignController.resetCampaign);

// Delete campaign
router.delete('/:id', auth, authorize('admin'), campaignController.deleteCampaign);

module.exports = router;

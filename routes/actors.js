const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { upload, handleUploadError } = require('../middleware/upload');
const actorController = require('../controllers/actorController');

const router = express.Router();

// Validation rules
const actorValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên actor là bắt buộc')
    .isLength({ max: 100 })
    .withMessage('Tên actor không được quá 100 ký tự'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự'),
  body('type')
    .isIn(['web-scraper', 'news-scraper', 'product-scraper', 'social-scraper', 'custom'])
    .withMessage('Loại actor không hợp lệ'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'draft'])
    .withMessage('Trạng thái không hợp lệ'),
  body('config.maxConcurrency')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Số lượng đồng thời phải từ 1-50'),
  body('config.timeout')
    .optional()
    .isInt({ min: 5000, max: 300000 })
    .withMessage('Timeout phải từ 5000-300000ms'),
  body('config.retryAttempts')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Số lần thử lại phải từ 0-10'),
  validate
];

// Get all actors
router.get('/', auth, actorController.getAllActors);

// Get actor statistics
router.get('/stats/overview', auth, actorController.getActorStats);

// Create new actor (with file upload)
router.post('/',
  auth,
  authorize('admin', 'editor'),
  upload.single('actorFile'),
  handleUploadError,
  actorValidation,
  actorController.createActor
);

// Get actor by ID
router.get('/:id', auth, actorController.getActorById);

// Download actor file
router.get('/:id/download', auth, actorController.downloadActorFile);

// Run actor
router.post('/:id/run', auth, actorController.runActor);

// Get actor runs history
router.get('/:id/runs', auth, actorController.getActorRuns);

// Update actor
router.put('/:id', auth, authorize('admin', 'editor'), actorValidation, actorController.updateActor);

// Delete actor
router.delete('/:id', auth, authorize('admin'), actorController.deleteActor);

module.exports = router; 
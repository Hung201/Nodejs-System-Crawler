const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const templateController = require('../controllers/templateController');

const router = express.Router();

// Validation rules for template creation
const templateValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tên template là bắt buộc')
        .isLength({ max: 100 })
        .withMessage('Tên template không được quá 100 ký tự'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Mô tả không được quá 500 ký tự'),
    body('website')
        .trim()
        .notEmpty()
        .withMessage('Tên website là bắt buộc'),
    body('urlPattern')
        .trim()
        .notEmpty()
        .withMessage('URL pattern là bắt buộc'),
    body('category')
        .optional()
        .isIn(['ecommerce', 'news', 'blog', 'social', 'other'])
        .withMessage('Category không hợp lệ'),
    body('actorId')
        .optional()
        .isMongoId()
        .withMessage('Actor ID không hợp lệ'),
    body('actorType')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Actor type là bắt buộc'),
    body('input')
        .optional()
        .isObject()
        .withMessage('Input phải là object'),
    body('filters.priceMin')
        .optional()
        .isNumeric()
        .withMessage('Price min phải là số'),
    body('filters.priceMax')
        .optional()
        .isNumeric()
        .withMessage('Price max phải là số'),
    body('filters.ratingMin')
        .optional()
        .isNumeric()
        .withMessage('Rating min phải là số'),
    body('filters.categories')
        .optional()
        .isArray()
        .withMessage('Categories phải là mảng'),
    body('filters.brands')
        .optional()
        .isArray()
        .withMessage('Brands phải là mảng'),
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'testing'])
        .withMessage('Status không hợp lệ'),
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('isPublic phải là boolean'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags phải là mảng'),
    body('version')
        .optional()
        .trim()
        .matches(/^\d+\.\d+\.\d+$/)
        .withMessage('Version phải có format x.y.z')
];

// Validation for template from actor
const templateFromActorValidation = [
    body('actorId')
        .isMongoId()
        .withMessage('Actor ID không hợp lệ'),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tên template là bắt buộc')
        .isLength({ max: 100 })
        .withMessage('Tên template không được quá 100 ký tự'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Mô tả không được quá 500 ký tự'),
    body('website')
        .trim()
        .notEmpty()
        .withMessage('Tên website là bắt buộc'),
    body('urlPattern')
        .trim()
        .notEmpty()
        .withMessage('URL pattern là bắt buộc'),
    body('category')
        .optional()
        .isIn(['ecommerce', 'news', 'blog', 'social', 'other'])
        .withMessage('Category không hợp lệ'),
    body('input')
        .isObject()
        .withMessage('Input configuration là bắt buộc'),
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('isPublic phải là boolean'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags phải là mảng')
];

// ===== STATISTICS & OVERVIEW ROUTES =====

// Get all templates
router.get('/', auth, templateController.getAllTemplates);

// Get template statistics
router.get('/stats', auth, templateController.getTemplateStats);

// Get popular templates
router.get('/popular', auth, templateController.getPopularTemplates);

// ===== ACTOR-BASED TEMPLATE CREATION =====

// Get available actors for template creation
router.get('/actors', auth, templateController.getAvailableActors);

// Get actor schema for template creation
router.get('/actors/:actorId/schema', auth, templateController.getActorSchema);

// Create template from actor
router.post('/from-actor', auth, templateFromActorValidation, validate, templateController.createTemplateFromActor);

// Find templates by actor type
router.get('/actor-type/:actorType', auth, templateController.findTemplatesByActorType);

// ===== SEARCH & DISCOVERY ROUTES =====

// Search templates by tags
router.get('/search/tags', auth, templateController.searchTemplatesByTags);

// Find template for URL
router.get('/find-url/:url(*)', auth, templateController.findTemplateForUrl);

// ===== TEMPLATE OPERATIONS =====

// Test template with URL
router.post('/:id/test', auth, [
    body('testUrl')
        .trim()
        .notEmpty()
        .withMessage('Test URL là bắt buộc')
        .isURL()
        .withMessage('Test URL không hợp lệ')
], validate, templateController.testTemplate);

// Clone template
router.post('/:id/clone', auth, [
    body('newName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Tên mới không được quá 100 ký tự')
], validate, templateController.cloneTemplate);

// Update template success rate
router.put('/:id/success-rate', auth, [
    body('successRate')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Success rate phải là số từ 0 đến 100')
], validate, templateController.updateTemplateSuccessRate);

// ===== CRUD OPERATIONS =====

// Get template by ID
router.get('/:id', auth, templateController.getTemplateById);

// Create new template
router.post('/', auth, templateValidation, validate, templateController.createTemplate);

// Update template
router.put('/:id', auth, templateValidation, validate, templateController.updateTemplate);

// Delete template
router.delete('/:id', auth, templateController.deleteTemplate);

module.exports = router;

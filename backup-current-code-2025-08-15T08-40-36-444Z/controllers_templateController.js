const templateService = require('../services/templateService');
const { validationResult } = require('express-validator');

// @desc    Get all templates
// @route   GET /api/templates
// @access  Private
const getAllTemplates = async (req, res) => {
    try {
        const filters = req.query;
        const result = await templateService.getAllTemplates(filters);
        res.json({
            success: true,
            data: result.templates,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error getting templates:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi lấy danh sách templates'
        });
    }
};

// @desc    Get template statistics
// @route   GET /api/templates/stats
// @access  Private
const getTemplateStats = async (req, res) => {
    try {
        const stats = await templateService.getTemplateStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting template stats:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi lấy thống kê templates'
        });
    }
};

// @desc    Get popular templates
// @route   GET /api/templates/popular
// @access  Private
const getPopularTemplates = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const templates = await templateService.getPopularTemplates(limit);
        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('Error getting popular templates:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi lấy templates phổ biến'
        });
    }
};

// @desc    Get available actors for template creation
// @route   GET /api/templates/actors
// @access  Private
const getAvailableActors = async (req, res) => {
    try {
        const actors = await templateService.getAvailableActors();
        res.json({
            success: true,
            data: actors
        });
    } catch (error) {
        console.error('Error getting available actors:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi lấy danh sách actors'
        });
    }
};

// @desc    Get actor schema for template creation
// @route   GET /api/templates/actors/:actorId/schema
// @access  Private
const getActorSchema = async (req, res) => {
    try {
        const { actorId } = req.params;
        const result = await templateService.getActorSchema(actorId);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error getting actor schema:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi lấy schema của actor'
        });
    }
};

// @desc    Find template for URL
// @route   GET /api/templates/find-url/:url
// @access  Private
const findTemplateForUrl = async (req, res) => {
    try {
        const { url } = req.params;
        const template = await templateService.findTemplateForUrl(url);

        if (!template) {
            return res.json({
                success: true,
                data: null,
                message: 'Không tìm thấy template phù hợp cho URL này'
            });
        }

        res.json({
            success: true,
            data: template
        });
    } catch (error) {
        console.error('Error finding template for URL:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi tìm template cho URL'
        });
    }
};

// @desc    Get template by ID
// @route   GET /api/templates/:id
// @access  Private
const getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await templateService.getTemplateById(id);
        res.json({
            success: true,
            data: template
        });
    } catch (error) {
        console.error('Error getting template by ID:', error);
        res.status(404).json({
            success: false,
            error: error.message || 'Không tìm thấy template'
        });
    }
};

// @desc    Create new template
// @route   POST /api/templates
// @access  Private
const createTemplate = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Dữ liệu không hợp lệ',
                details: errors.array()
            });
        }

        const templateData = req.body;
        const createdBy = req.user.id;

        const template = await templateService.createTemplate(templateData, createdBy);
        res.status(201).json({
            success: true,
            data: template,
            message: 'Template đã được tạo thành công'
        });
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi tạo template'
        });
    }
};

// @desc    Create template from actor
// @route   POST /api/templates/from-actor
// @access  Private
const createTemplateFromActor = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Dữ liệu không hợp lệ',
                details: errors.array()
            });
        }

        const { actorId, ...templateData } = req.body;
        const createdBy = req.user.id;

        if (!actorId) {
            return res.status(400).json({
                success: false,
                error: 'Actor ID là bắt buộc'
            });
        }

        const template = await templateService.createTemplateFromActor(actorId, templateData, createdBy);
        res.status(201).json({
            success: true,
            data: template,
            message: 'Template đã được tạo thành công từ actor'
        });
    } catch (error) {
        console.error('Error creating template from actor:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi tạo template từ actor'
        });
    }
};

// @desc    Update template
// @route   PUT /api/templates/:id
// @access  Private
const updateTemplate = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Dữ liệu không hợp lệ',
                details: errors.array()
            });
        }

        const { id } = req.params;
        const updateData = req.body;
        const userId = req.user.id;

        const template = await templateService.updateTemplate(id, updateData, userId);
        res.json({
            success: true,
            data: template,
            message: 'Template đã được cập nhật thành công'
        });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi cập nhật template'
        });
    }
};

// @desc    Delete template
// @route   DELETE /api/templates/:id
// @access  Private
const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await templateService.deleteTemplate(id, userId);
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi xóa template'
        });
    }
};

// @desc    Test template with URL
// @route   POST /api/templates/:id/test
// @access  Private
const testTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { testUrl } = req.body;

        if (!testUrl) {
            return res.status(400).json({
                success: false,
                error: 'URL test là bắt buộc'
            });
        }

        const result = await templateService.testTemplate(id, testUrl);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error testing template:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi test template'
        });
    }
};

// @desc    Clone template
// @route   POST /api/templates/:id/clone
// @access  Private
const cloneTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { newName } = req.body;
        const userId = req.user.id;

        const clonedTemplate = await templateService.cloneTemplate(id, userId, newName);
        res.status(201).json({
            success: true,
            data: clonedTemplate,
            message: 'Template đã được clone thành công'
        });
    } catch (error) {
        console.error('Error cloning template:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi clone template'
        });
    }
};

// @desc    Search templates by tags
// @route   GET /api/templates/search/tags
// @access  Private
const searchTemplatesByTags = async (req, res) => {
    try {
        const { tags } = req.query;
        const limit = parseInt(req.query.limit) || 20;

        if (!tags) {
            return res.status(400).json({
                success: false,
                error: 'Tags là bắt buộc'
            });
        }

        const tagArray = tags.split(',').map(tag => tag.trim());
        const templates = await templateService.searchTemplatesByTags(tagArray, limit);

        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('Error searching templates by tags:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi tìm kiếm templates'
        });
    }
};

// @desc    Find templates by actor type
// @route   GET /api/templates/actor-type/:actorType
// @access  Private
const findTemplatesByActorType = async (req, res) => {
    try {
        const { actorType } = req.params;
        const templates = await templateService.findTemplatesByActorType(actorType);

        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('Error finding templates by actor type:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi tìm templates theo actor type'
        });
    }
};

// @desc    Update template success rate
// @route   PUT /api/templates/:id/success-rate
// @access  Private
const updateTemplateSuccessRate = async (req, res) => {
    try {
        const { id } = req.params;
        const { successRate } = req.body;

        if (successRate === undefined || successRate < 0 || successRate > 100) {
            return res.status(400).json({
                success: false,
                error: 'Success rate phải là số từ 0 đến 100'
            });
        }

        const template = await templateService.updateTemplateSuccessRate(id, successRate);
        res.json({
            success: true,
            data: template,
            message: 'Success rate đã được cập nhật thành công'
        });
    } catch (error) {
        console.error('Error updating template success rate:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi cập nhật success rate'
        });
    }
};

module.exports = {
    getAllTemplates,
    getTemplateStats,
    getPopularTemplates,
    getAvailableActors,
    getActorSchema,
    findTemplateForUrl,
    getTemplateById,
    createTemplate,
    createTemplateFromActor,
    updateTemplate,
    deleteTemplate,
    testTemplate,
    cloneTemplate,
    searchTemplatesByTags,
    findTemplatesByActorType,
    updateTemplateSuccessRate
};

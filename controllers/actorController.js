const { validationResult } = require('express-validator');
const actorService = require('../services/actorService');

// @desc    Get all actors
// @route   GET /api/actors
// @access  Private
const getAllActors = async (req, res) => {
    try {
        const filters = req.query;
        const result = await actorService.getAllActors(filters);

        res.json({
            success: true,
            data: result.actors,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error getting actors:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy danh sách actors'
        });
    }
};

// @desc    Get actor by ID
// @route   GET /api/actors/:id
// @access  Private
const getActorById = async (req, res) => {
    try {
        const actor = await actorService.getActorById(req.params.id);

        res.json({
            success: true,
            data: actor
        });
    } catch (error) {
        console.error('Error getting actor:', error);
        if (error.message === 'Không tìm thấy actor') {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy thông tin actor'
        });
    }
};

// @desc    Create new actor
// @route   POST /api/actors
// @access  Private (Admin, Editor)
const createActor = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Dữ liệu không hợp lệ',
                details: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg,
                    value: err.value
                }))
            });
        }

        const actorData = req.body;
        const file = req.file;
        const createdBy = req.user.id;

        const actor = await actorService.createActor(actorData, file, createdBy);

        res.status(201).json({
            success: true,
            data: actor
        });
    } catch (error) {
        console.error('Error creating actor:', error);
        if (error.message === 'Tên actor đã tồn tại') {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi tạo actor'
        });
    }
};

// @desc    Update actor
// @route   PUT /api/actors/:id
// @access  Private (Admin, Editor)
const updateActor = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Dữ liệu không hợp lệ',
                details: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg,
                    value: err.value
                }))
            });
        }

        const updateData = req.body;
        const updatedBy = req.user.id;

        const actor = await actorService.updateActor(req.params.id, updateData, updatedBy);

        res.json({
            success: true,
            data: actor
        });
    } catch (error) {
        console.error('Error updating actor:', error);
        if (error.message === 'Không tìm thấy actor') {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        if (error.message === 'Tên actor đã tồn tại') {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi cập nhật actor'
        });
    }
};

// @desc    Delete actor
// @route   DELETE /api/actors/:id
// @access  Private (Admin)
const deleteActor = async (req, res) => {
    try {
        const result = await actorService.deleteActor(req.params.id);

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error deleting actor:', error);
        if (error.message === 'Không tìm thấy actor') {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        if (error.message.includes('đang được sử dụng')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi xóa actor'
        });
    }
};

// @desc    Get actor statistics
// @route   GET /api/actors/stats/overview
// @access  Private
const getActorStats = async (req, res) => {
    try {
        const stats = await actorService.getActorStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting actor stats:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy thống kê actors'
        });
    }
};







module.exports = {
    getAllActors,
    getActorById,
    createActor,
    updateActor,
    deleteActor,
    getActorStats
};
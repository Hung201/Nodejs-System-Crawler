const userService = require('../services/userService');
const { validationResult } = require('express-validator');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        const filters = req.query;
        const result = await userService.getAllUsers(filters);
        res.json({
            success: true,
            data: result.users,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi lấy danh sách users'
        });
    }
};

// @desc    Create new user (Admin only)
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res) => {
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

        const user = await userService.createUser(req.body, req.user.id);
        res.status(201).json({
            success: true,
            data: user,
            message: `Người dùng ${user.role} đã được tạo thành công`
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi tạo user'
        });
    }
};

// @desc    Get user by ID (Admin, Editor can view their own, Admin can view all)
// @route   GET /api/users/:id
// @access  Private (Admin, Editor)
const getUserById = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);

        // Check permissions: Admin can view all, Editor can view their own
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                error: 'Không có quyền xem thông tin user này'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(404).json({
            success: false,
            error: error.message || 'Lỗi server khi lấy thông tin user'
        });
    }
};

// @desc    Update user (Admin can update all, Editor can update their own)
// @route   PUT /api/users/:id
// @access  Private (Admin, Editor)
const updateUser = async (req, res) => {
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

        const user = await userService.updateUser(req.params.id, req.body, req.user);
        res.json({
            success: true,
            data: user,
            message: 'User đã được cập nhật thành công'
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi cập nhật user'
        });
    }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    try {
        const result = await userService.deleteUser(req.params.id, req.user);
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi xóa user'
        });
    }
};

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats/overview
// @access  Private (Admin)
const getUserStats = async (req, res) => {
    try {
        const stats = await userService.getUserStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi lấy thống kê users'
        });
    }
};

// @desc    Get current user profile
// @route   GET /api/users/profile/me
// @access  Private (All roles)
const getMyProfile = async (req, res) => {
    try {
        const user = await userService.getMyProfile(req.user.id);
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi lấy thông tin profile'
        });
    }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile/me
// @access  Private (All roles)
const updateMyProfile = async (req, res) => {
    try {
        const user = await userService.updateMyProfile(req.user.id, req.body);
        res.json({
            success: true,
            data: user,
            message: 'Profile đã được cập nhật thành công'
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi cập nhật profile'
        });
    }
};

module.exports = {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    getUserStats,
    getMyProfile,
    updateMyProfile
}; 
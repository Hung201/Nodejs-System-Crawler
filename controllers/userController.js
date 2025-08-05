const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, role, search } = req.query;

        // Build filter
        const filter = {};
        if (status) filter.status = status;
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find(filter)
            .select('-password') // Exclude password
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy danh sách users'
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

        const { name, email, password, role = 'viewer', status = 'active' } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email đã tồn tại'
            });
        }

        const user = new User({
            name,
            email,
            password,
            role,
            status,
            createdBy: req.user.id
        });

        await user.save();

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            data: userResponse,
            message: `Người dùng ${role} đã được tạo thành công`
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi tạo user'
        });
    }
};

// @desc    Get user by ID (Admin, Editor can view their own, Admin can view all)
// @route   GET /api/users/:id
// @access  Private (Admin, Editor)
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy user'
            });
        }

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
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy thông tin user'
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

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy user'
            });
        }

        // Check permissions: Admin can update all, Editor can update their own
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                error: 'Không có quyền cập nhật user này'
            });
        }

        const { name, email, password, role, status } = req.body;

        // Only Admin can change role
        if (role && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Chỉ Admin mới có quyền thay đổi vai trò'
            });
        }

        // Check if new email conflicts with existing user
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Email đã tồn tại'
                });
            }
        }

        // Update fields
        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (role !== undefined && req.user.role === 'admin') user.role = role;
        if (status !== undefined && req.user.role === 'admin') user.status = status;

        // Update password if provided
        if (password) {
            user.password = password;
        }

        user.updatedBy = req.user.id;
        await user.save();

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            data: userResponse,
            message: 'User đã được cập nhật thành công'
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi cập nhật user'
        });
    }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy user'
            });
        }

        // Prevent deleting own account
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                error: 'Không thể xóa tài khoản của chính mình'
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'User đã được xóa thành công'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi xóa user'
        });
    }
};

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats/overview
// @access  Private (Admin)
const getUserStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    inactive: {
                        $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
                    }
                }
            }
        ]);

        const roleStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                overview: stats[0] || { total: 0, active: 0, inactive: 0 },
                byRole: roleStats
            }
        });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy thống kê users'
        });
    }
};

// @desc    Get current user profile
// @route   GET /api/users/profile/me
// @access  Private (All roles)
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy thông tin profile'
        });
    }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile/me
// @access  Private (All roles)
const updateMyProfile = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy user'
            });
        }

        // Check if new email conflicts with existing user
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Email đã tồn tại'
                });
            }
        }

        // Update fields
        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;

        // Update password if provided
        if (password) {
            user.password = password;
        }

        await user.save();

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            data: userResponse,
            message: 'Profile đã được cập nhật thành công'
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi cập nhật profile'
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
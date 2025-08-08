const User = require('../models/User');

// Get all users with pagination and filters
const getAllUsers = async (filters, pagination) => {
    const { page = 1, limit = 10, status, role, search } = filters;

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

    return {
        users,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    };
};

// Create new user
const createUser = async (userData, createdBy) => {
    const { name, email, password, role = 'viewer', status = 'active' } = userData;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error('Email đã tồn tại');
    }

    const user = new User({
        name,
        email,
        password,
        role,
        status,
        createdBy
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return userResponse;
};

// Get user by ID
const getUserById = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
        throw new Error('Không tìm thấy user');
    }
    return user;
};

// Update user
const updateUser = async (userId, updateData, currentUser) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('Không tìm thấy user');
    }

    const { name, email, password, role, status } = updateData;

    // Check permissions: Admin can update all, Editor can update their own
    if (currentUser.role !== 'admin' && currentUser._id.toString() !== userId) {
        throw new Error('Không có quyền cập nhật user này');
    }

    // Only Admin can change role
    if (role && currentUser.role !== 'admin') {
        throw new Error('Chỉ Admin mới có quyền thay đổi vai trò');
    }

    // Check if new email conflicts with existing user
    if (email && email !== user.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
            throw new Error('Email đã tồn tại');
        }
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined && currentUser.role === 'admin') user.role = role;
    if (status !== undefined && currentUser.role === 'admin') user.status = status;

    // Update password if provided
    if (password) {
        user.password = password;
    }

    user.updatedBy = currentUser._id;
    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return userResponse;
};

// Delete user
const deleteUser = async (userId, currentUser) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('Không tìm thấy user');
    }

    // Prevent deleting own account
    if (user._id.toString() === currentUser._id.toString()) {
        throw new Error('Không thể xóa tài khoản của chính mình');
    }

    await User.findByIdAndDelete(userId);
    return { message: 'User đã được xóa thành công' };
};

// Get user statistics
const getUserStats = async () => {
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

    return {
        overview: stats[0] || { total: 0, active: 0, inactive: 0 },
        byRole: roleStats
    };
};

// Get current user profile
const getMyProfile = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
        throw new Error('Không tìm thấy user');
    }
    return user;
};

// Update current user profile
const updateMyProfile = async (userId, updateData) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('Không tìm thấy user');
    }

    const { name, email, password } = updateData;

    // Check if new email conflicts with existing user
    if (email && email !== user.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
            throw new Error('Email đã tồn tại');
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

    return userResponse;
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

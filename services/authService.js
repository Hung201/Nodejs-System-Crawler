const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../utils/logger');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Register user
const registerUser = async (userData) => {
    const { name, email, password, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error('Email đã được sử dụng');
    }

    // Create new user
    const user = new User({
        name,
        email,
        password,
        role: role || 'viewer'
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    return {
        user,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    };
};

// Login user
const loginUser = async (email, password) => {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Check if user is active
    if (user.status !== 'active') {
        throw new Error('Tài khoản không hoạt động');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    return {
        user,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    };
};

// Get user profile
const getUserProfile = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('Không tìm thấy người dùng');
    }
    return user;
};

// Update user profile
const updateUserProfile = async (userId, updateData) => {
    const { name, email } = updateData;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;

    const user = await User.findByIdAndUpdate(
        userId,
        updates,
        { new: true, runValidators: true }
    );

    if (!user) {
        throw new Error('Không tìm thấy người dùng');
    }

    return user;
};

// Change password
const changeUserPassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('Không tìm thấy người dùng');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
        throw new Error('Mật khẩu hiện tại không đúng');
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    return { message: 'Mật khẩu đã được thay đổi' };
};

module.exports = {
    generateToken,
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    changeUserPassword
};

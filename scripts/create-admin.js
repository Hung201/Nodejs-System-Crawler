const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function createAdminUser() {
    try {
        // Kết nối MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Xóa user cũ nếu có
        await User.deleteMany({ email: 'admin@system-crawler.com' });
        console.log('Deleted existing admin user');

        // Tạo password hash
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Tạo admin user mới
        const adminUser = new User({
            name: 'Admin',
            email: 'admin@system-crawler.com',
            password: hashedPassword,
            role: 'admin',
            status: 'active'
        });

        await adminUser.save();
        console.log('Admin user created successfully!');
        console.log('Email: admin@system-crawler.com');
        console.log('Password: admin123');

        // Đóng kết nối
        await mongoose.connection.close();
        console.log('Database connection closed');

    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdminUser(); 
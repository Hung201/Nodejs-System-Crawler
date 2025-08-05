const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function createDemoUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete existing demo users
        await User.deleteMany({
            email: {
                $in: [
                    'admin@example.com',
                    'editor@example.com',
                    'viewer@example.com'
                ]
            }
        });
        console.log('Deleted existing demo users');

        // Create Admin user
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin',
            status: 'active'
        });
        await adminUser.save();
        console.log('✅ Admin user created: admin@example.com / password123');

        // Create Editor user
        const editorUser = new User({
            name: 'Editor User',
            email: 'editor@example.com',
            password: 'password123',
            role: 'editor',
            status: 'active'
        });
        await editorUser.save();
        console.log('✅ Editor user created: editor@example.com / password123');

        // Create Viewer user
        const viewerUser = new User({
            name: 'Viewer User',
            email: 'viewer@example.com',
            password: 'password123',
            role: 'viewer',
            status: 'active'
        });
        await viewerUser.save();
        console.log('✅ Viewer user created: viewer@example.com / password123');

        await mongoose.connection.close();
        console.log('Database connection closed');
        console.log('\n🎉 Demo users created successfully!');
        console.log('🔑 Login credentials:');
        console.log('   Admin:  admin@example.com / password123');
        console.log('   Editor: editor@example.com / password123');
        console.log('   Viewer: viewer@example.com / password123');

    } catch (error) {
        console.error('Error creating demo users:', error);
        process.exit(1);
    }
}

createDemoUsers(); 
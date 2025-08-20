#!/usr/bin/env node

/**
 * Script test API thêm actor từ folder cục bộ
 * 
 * Cách sử dụng:
 * 1. Đảm bảo server đang chạy
 * 2. Cập nhật AUTH_TOKEN với token thực tế
 * 3. Cập nhật FOLDER_PATH với đường dẫn folder thực tế
 * 4. Chạy: node scripts/test-add-actor-from-folder.js
 */

const axios = require('axios');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'your_jwt_token_here'; // Thay thế bằng token thực tế
const FOLDER_PATH = 'D:\\google-search-craw'; // Thay thế bằng đường dẫn thực tế

async function loginAndGetToken() {
    try {
        console.log('🔐 Đang đăng nhập để lấy token...');

        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@example.com', // Thay thế bằng email thực tế
            password: 'password123'     // Thay thế bằng password thực tế
        });

        if (response.data.success) {
            console.log('✅ Đăng nhập thành công!');
            return response.data.token;
        } else {
            throw new Error('Đăng nhập thất bại');
        }
    } catch (error) {
        console.error('❌ Lỗi đăng nhập:', error.response?.data || error.message);
        throw error;
    }
}

async function addActorFromFolder(token, folderPath) {
    try {
        console.log('\n🔄 Đang thêm actor từ folder...');
        console.log(`📁 Folder path: ${folderPath}`);

        const actorName = `test-actor-${Date.now()}`;
        const description = `Test actor imported from ${path.basename(folderPath)}`;

        const response = await axios.post(
            `${API_BASE_URL}/actors/from-folder`,
            {
                folderPath: folderPath,
                name: actorName,
                description: description,
                type: 'web-scraping',
                category: 'web-scraping',
                visibility: 'private'
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Actor đã được thêm thành công!');
        console.log('📊 Response:', JSON.stringify(response.data, null, 2));

        return response.data;
    } catch (error) {
        console.error('❌ Error adding actor from folder:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

async function testAddActorFromFolder() {
    try {
        console.log('🚀 Bắt đầu test API thêm actor từ folder...\n');

        // Lấy token (bỏ comment nếu muốn tự động đăng nhập)
        // const token = await loginAndGetToken();
        const token = AUTH_TOKEN;

        if (token === 'your_jwt_token_here') {
            console.error('❌ Vui lòng cập nhật AUTH_TOKEN với token thực tế!');
            console.log('💡 Có thể sử dụng loginAndGetToken() để lấy token tự động');
            return;
        }

        if (FOLDER_PATH === 'D:\\google-search-craw') {
            console.error('❌ Vui lòng cập nhật FOLDER_PATH với đường dẫn folder thực tế!');
            return;
        }

        // Test thêm actor từ folder
        const result = await addActorFromFolder(token, FOLDER_PATH);

        console.log('\n🎉 Test completed successfully!');
        console.log(`Actor ID: ${result.data.id}`);
        console.log(`Actor Name: ${result.data.name}`);
        console.log(`Zip file: ${result.data.zipFile}`);

        // Test lấy thông tin actor vừa tạo
        console.log('\n📋 Đang lấy thông tin actor vừa tạo...');
        const actorResponse = await axios.get(
            `${API_BASE_URL}/actors/${result.data.id}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        console.log('✅ Thông tin actor:', {
            id: actorResponse.data.data._id,
            name: actorResponse.data.data.name,
            description: actorResponse.data.data.description,
            status: actorResponse.data.data.status,
            version: actorResponse.data.data.version
        });

    } catch (error) {
        console.error('\n💥 Test failed:', error.message);

        if (error.code === 'ENOTFOUND') {
            console.log('💡 Đảm bảo server đang chạy tại http://localhost:5000');
        }

        if (error.response?.status === 401) {
            console.log('💡 Token không hợp lệ, vui lòng cập nhật AUTH_TOKEN');
        }

        if (error.response?.status === 403) {
            console.log('💡 Không có quyền truy cập, kiểm tra role của user');
        }
    }
}

// Export functions
module.exports = {
    loginAndGetToken,
    addActorFromFolder,
    testAddActorFromFolder
};

// Run test if this file is executed directly
if (require.main === module) {
    testAddActorFromFolder();
}

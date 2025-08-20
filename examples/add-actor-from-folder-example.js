// Ví dụ test API thêm actor từ folder cục bộ
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'your_jwt_token_here'; // Thay thế bằng token thực tế

async function addActorFromFolder(token, folderPath, actorName, description) {
    try {
        console.log('🔄 Đang thêm actor từ folder...');
        console.log(`📁 Folder path: ${folderPath}`);
        console.log(`🎭 Actor name: ${actorName}`);

        const response = await axios.post(
            `${API_BASE_URL}/actors/from-folder`,
            {
                folderPath: folderPath,
                name: actorName,
                description: description || `Actor imported from ${folderPath}`,
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
        // Thay thế bằng token thực tế từ login API
        const token = AUTH_TOKEN;

        // Thay thế bằng đường dẫn folder thực tế
        const folderPath = 'D:\\google-search-craw';
        const actorName = 'google-search-crawler';
        const description = 'Google Search Crawler imported from local folder';

        // Thêm actor từ folder
        const result = await addActorFromFolder(token, folderPath, actorName, description);

        console.log('\n🎉 Test completed successfully!');
        console.log(`Actor ID: ${result.data.id}`);
        console.log(`Zip file: ${result.data.zipFile}`);

    } catch (error) {
        console.error('\n💥 Test failed:', error.message);
    }
}

// Export functions for use in other files
module.exports = {
    addActorFromFolder,
    testAddActorFromFolder
};

// Run test if this file is executed directly
if (require.main === module) {
    testAddActorFromFolder();
}

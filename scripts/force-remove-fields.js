const mongoose = require('mongoose');
require('dotenv').config();

async function forceRemoveFields() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Đã kết nối MongoDB');

        // Sử dụng collection trực tiếp
        const db = mongoose.connection.db;
        const collection = db.collection('templates');

        // Xóa trường selectors và config
        const result = await collection.updateMany(
            {},
            {
                $unset: {
                    selectors: "",
                    config: ""
                }
            }
        );

        console.log('📊 Kết quả update:', result);

        // Kiểm tra lại
        const templates = await collection.find({}).toArray();
        const hasSelectors = templates.some(t => t.selectors);
        const hasConfig = templates.some(t => t.config);

        console.log('🔍 Kiểm tra sau khi update:');
        console.log('- Có selectors:', hasSelectors);
        console.log('- Có config:', hasConfig);

        if (!hasSelectors && !hasConfig) {
            console.log('✅ Đã xóa thành công selectors và config!');
        } else {
            console.log('❌ Vẫn còn selectors hoặc config!');
            console.log('📋 Templates có selectors:', templates.filter(t => t.selectors).map(t => t.name));
            console.log('📋 Templates có config:', templates.filter(t => t.config).map(t => t.name));
        }

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối MongoDB');
    }
}

forceRemoveFields();

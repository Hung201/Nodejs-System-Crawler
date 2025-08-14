const mongoose = require('mongoose');
require('dotenv').config();

async function removeSelectorsConfig() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Đã kết nối MongoDB');

        const Template = require('../models/Template');

        // Xóa trường selectors và config
        const result = await Template.updateMany(
            {},
            { $unset: { selectors: 1, config: 1 } }
        );

        console.log('📊 Kết quả update:', result);

        // Kiểm tra lại
        const templates = await Template.find({}).lean();
        const hasSelectors = templates.some(t => t.selectors);
        const hasConfig = templates.some(t => t.config);

        console.log('🔍 Kiểm tra sau khi update:');
        console.log('- Có selectors:', hasSelectors);
        console.log('- Có config:', hasConfig);

        if (!hasSelectors && !hasConfig) {
            console.log('✅ Đã xóa thành công selectors và config!');
        } else {
            console.log('❌ Vẫn còn selectors hoặc config!');
        }

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối MongoDB');
    }
}

removeSelectorsConfig();

const mongoose = require('mongoose');
const Template = require('../models/Template');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_URI_PROD, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function migrateTemplateSchema() {
    try {
        console.log('🔄 Bắt đầu migrate template schema...');

        // Get all templates
        const templates = await Template.find({});
        console.log(`📊 Tìm thấy ${templates.length} templates cần migrate`);

        let updatedCount = 0;

        for (const template of templates) {
            console.log(`\n🔧 Đang xử lý template: ${template.name}`);

            // Remove selectors and config fields
            const updateData = {
                $unset: {
                    selectors: 1,
                    config: 1
                }
            };

            // Update template
            await Template.findByIdAndUpdate(template._id, updateData);
            updatedCount++;

            console.log(`✅ Đã cập nhật template: ${template.name}`);
        }

        console.log(`\n🎉 Hoàn thành! Đã migrate ${updatedCount} templates`);

        // Verify migration
        const verifyTemplates = await Template.find({});
        const hasSelectors = verifyTemplates.some(t => t.selectors);
        const hasConfig = verifyTemplates.some(t => t.config);

        console.log(`\n🔍 Kết quả kiểm tra:`);
        console.log(`- Templates có selectors: ${hasSelectors ? 'CÓ' : 'KHÔNG'}`);
        console.log(`- Templates có config: ${hasConfig ? 'CÓ' : 'KHÔNG'}`);

        if (!hasSelectors && !hasConfig) {
            console.log('✅ Migration thành công!');
        } else {
            console.log('❌ Migration chưa hoàn tất!');
        }

    } catch (error) {
        console.error('❌ Lỗi trong quá trình migrate:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối MongoDB');
    }
}

// Run migration
migrateTemplateSchema();

const mongoose = require('mongoose');

const actorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên actor là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên actor không được quá 100 ký tự']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },
    type: {
        type: String,
        required: [true, 'Loại actor là bắt buộc'],
        enum: {
            values: ['web-scraper', 'news-scraper', 'product-scraper', 'social-scraper', 'custom'],
            message: 'Loại actor không hợp lệ'
        }
    },
    config: {
        maxConcurrency: {
            type: Number,
            default: 10,
            min: [1, 'Số lượng đồng thời tối thiểu là 1'],
            max: [50, 'Số lượng đồng thời tối đa là 50']
        },
        timeout: {
            type: Number,
            default: 30000,
            min: [5000, 'Timeout tối thiểu là 5000ms'],
            max: [300000, 'Timeout tối đa là 300000ms']
        },
        retryAttempts: {
            type: Number,
            default: 3,
            min: [0, 'Số lần thử lại không được âm'],
            max: [10, 'Số lần thử lại tối đa là 10']
        },
        userAgent: {
            type: String,
            default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        proxy: {
            enabled: {
                type: Boolean,
                default: false
            },
            host: String,
            port: Number,
            username: String,
            password: String
        }
    },
    code: {
        type: String,
        trim: true
    },
    file: {
        filename: String,
        path: String,
        size: Number,
        mimetype: String
    },
    status: {
        type: String,
        enum: {
            values: ['active', 'inactive', 'draft'],
            message: 'Trạng thái không hợp lệ'
        },
        default: 'active'
    },
    version: {
        type: String,
        default: '1.0.0'
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
actorSchema.index({ name: 1 });
actorSchema.index({ type: 1 });
actorSchema.index({ status: 1 });
actorSchema.index({ createdBy: 1 });
actorSchema.index({ tags: 1 });

// Virtual for actor usage count
actorSchema.virtual('usageCount', {
    ref: 'Source',
    localField: '_id',
    foreignField: 'actorId',
    count: true
});

// Ensure virtual fields are serialized
actorSchema.set('toJSON', { virtuals: true });
actorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Actor', actorSchema); 
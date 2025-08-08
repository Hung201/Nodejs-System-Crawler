const mongoose = require('mongoose');

const actorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên actor là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên actor không được quá 100 ký tự'],
        unique: true
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

    // File-based storage fields
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    path: {
        type: String,
        required: true,
        default: function () {
            return `actors_storage/${this.userId}/${this._id}/`;
        }
    },
    files: [{
        type: String,
        default: []
    }],

    // File upload fields (for backward compatibility)
    fileUpload: {
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        mimetype: String,
        uploadedAt: Date
    },

    // Source code management (cho editor)
    sourceCode: {
        main: {
            type: String,
            trim: true
        },
        package: {
            type: String,
            trim: true
        },
        inputSchema: {
            type: String,
            trim: true
        },
        actorConfig: {
            type: String,
            trim: true
        },
        lastModified: Date
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

    // Build & Run tracking
    buildInfo: {
        lastBuildAt: Date,
        buildCount: {
            type: Number,
            default: 0
        },
        buildStatus: {
            type: String,
            enum: ['pending', 'building', 'success', 'failed'],
            default: 'pending'
        },
        buildLog: String,
        buildError: String
    },

    runInfo: {
        lastRunAt: Date,
        runCount: {
            type: Number,
            default: 0
        },
        runStatus: {
            type: String,
            enum: ['idle', 'running', 'completed', 'failed', 'stopped'],
            default: 'idle'
        },
        runLog: String,
        runError: String,
        currentRunId: String
    },

    // Environment variables
    environmentVariables: [{
        key: {
            type: String,
            required: true,
            trim: true
        },
        value: {
            type: String,
            required: true
        },
        isSecret: {
            type: Boolean,
            default: false
        }
    }],

    // Visibility & sharing
    visibility: {
        type: String,
        enum: ['public', 'private', 'shared'],
        default: 'private'
    },

    // Category for better organization
    category: {
        type: String,
        enum: ['web-scraping', 'e-commerce', 'news', 'social-media', 'data-processing', 'api-integration', 'other'],
        default: 'web-scraping'
    },

    // License information
    license: {
        type: String,
        default: 'MIT'
    },

    // Performance metrics
    metrics: {
        averageRunTime: Number, // in milliseconds
        successRate: Number,    // percentage
        totalDataProcessed: Number,
        lastPerformanceUpdate: Date
    },

    // Git integration (optional)
    gitInfo: {
        repository: String,
        branch: String,
        commitHash: String,
        lastSync: Date
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

    // Apify-style input schema
    inputSchema: {
        title: {
            type: String,
            default: 'Input Schema'
        },
        type: {
            type: String,
            default: 'object'
        },
        schemaVersion: {
            type: Number,
            default: 1
        },
        properties: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        required: {
            type: [String],
            default: []
        }
    },

    // Apify actor metadata
    apifyMetadata: {
        actorId: String,
        version: String,
        buildTag: String,
        buildNumber: Number,
        dockerImageName: String,
        dockerImageTag: String,
        sourceCodeUrl: String,
        readmeUrl: String,
        changelogUrl: String
    },

    status: {
        type: String,
        enum: {
            values: ['ready', 'building', 'running', 'error', 'draft', 'active', 'inactive'],
            message: 'Trạng thái không hợp lệ'
        },
        default: 'ready'
    },

    version: {
        type: String,
        default: '0.0.1'
    },

    public: {
        type: Boolean,
        default: false
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
actorSchema.index({ userId: 1 });
actorSchema.index({ tags: 1 });
actorSchema.index({ category: 1 });
actorSchema.index({ visibility: 1 });
actorSchema.index({ public: 1 });
actorSchema.index({ 'buildInfo.buildStatus': 1 });
actorSchema.index({ 'runInfo.runStatus': 1 });

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
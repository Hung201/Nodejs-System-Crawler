const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên chiến dịch là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên chiến dịch không được quá 100 ký tự']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },

    // Liên kết với Actor
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Actor',
        required: true
    },

    // Input data cho actor
    input: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Trạng thái chiến dịch
    status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },

    // Kết quả chạy
    result: {
        log: String,
        output: [mongoose.Schema.Types.Mixed],
        error: String,
        startTime: Date,
        endTime: Date,
        duration: Number, // milliseconds
        recordsProcessed: {
            type: Number,
            default: 0
        }
    },

    // Cấu hình chạy
    config: {
        timeout: {
            type: Number,
            default: 300000, // 5 phút
            min: [30000, 'Timeout tối thiểu là 30 giây'],
            max: [3600000, 'Timeout tối đa là 1 giờ']
        },
        maxRetries: {
            type: Number,
            default: 3,
            min: [0, 'Số lần thử lại không được âm'],
            max: [10, 'Số lần thử lại tối đa là 10']
        }
    },

    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Lịch sử chạy
    runHistory: [{
        runId: String,
        status: {
            type: String,
            enum: ['pending', 'running', 'completed', 'failed', 'cancelled']
        },
        startTime: Date,
        endTime: Date,
        duration: Number,
        log: String,
        output: [mongoose.Schema.Types.Mixed],
        error: String,
        recordsProcessed: Number
    }],

    // Thống kê
    stats: {
        totalRuns: {
            type: Number,
            default: 0
        },
        successfulRuns: {
            type: Number,
            default: 0
        },
        failedRuns: {
            type: Number,
            default: 0
        },
        averageDuration: {
            type: Number,
            default: 0
        },
        totalRecordsProcessed: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Indexes
campaignSchema.index({ actorId: 1, status: 1 });
campaignSchema.index({ createdBy: 1, createdAt: -1 });
campaignSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware để tính toán stats
campaignSchema.pre('save', function (next) {
    if (this.runHistory && this.runHistory.length > 0) {
        const runs = this.runHistory;
        this.stats.totalRuns = runs.length;
        this.stats.successfulRuns = runs.filter(r => r.status === 'completed').length;
        this.stats.failedRuns = runs.filter(r => r.status === 'failed').length;

        const completedRuns = runs.filter(r => r.status === 'completed' && r.duration);
        if (completedRuns.length > 0) {
            this.stats.averageDuration = completedRuns.reduce((sum, run) => sum + run.duration, 0) / completedRuns.length;
        }

        this.stats.totalRecordsProcessed = runs.reduce((sum, run) => sum + (run.recordsProcessed || 0), 0);
    }
    next();
});

// Virtual để tính success rate
campaignSchema.virtual('successRate').get(function () {
    if (this.stats.totalRuns === 0) return 0;
    return (this.stats.successfulRuns / this.stats.totalRuns) * 100;
});

// Method để thêm run history
campaignSchema.methods.addRunHistory = function (runData) {
    this.runHistory.push(runData);
    return this.save();
};

// Method để update result
campaignSchema.methods.updateResult = function (resultData) {
    this.result = { ...this.result, ...resultData };
    if (resultData.startTime) this.result.startTime = resultData.startTime;
    if (resultData.endTime) {
        this.result.endTime = resultData.endTime;
        if (this.result.startTime) {
            this.result.duration = this.result.endTime - this.result.startTime;
        }
    }
    return this.save();
};

module.exports = mongoose.model('Campaign', campaignSchema);

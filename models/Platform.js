const mongoose = require('mongoose');

const platformSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên platform là bắt buộc'],
        trim: true,
        maxlength: [255, 'Tên platform không được quá 255 ký tự']
    },
    type: {
        type: String,
        required: [true, 'Loại platform là bắt buộc'],
        enum: ['apify', 'scrapingbee', 'brightdata', 'scrapingant', 'other'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Mô tả không được quá 1000 ký tự']
    },
    apiToken: {
        type: String,
        required: [true, 'API token là bắt buộc'],
        trim: true,
        maxlength: [500, 'API token không được quá 500 ký tự']
    },
    baseURL: {
        type: String,
        trim: true,
        maxlength: [255, 'Base URL không được quá 255 ký tự']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    config: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    lastTested: {
        type: Date,
        default: null
    },
    testStatus: {
        type: String,
        enum: ['success', 'error', 'pending', null],
        default: null
    },
    testMessage: {
        type: String,
        trim: true,
        maxlength: [500, 'Test message không được quá 500 ký tự']
    }
}, {
    timestamps: true
});

// Indexes
platformSchema.index({ userId: 1 });
platformSchema.index({ type: 1 });
platformSchema.index({ isActive: 1 });
platformSchema.index({ userId: 1, type: 1 });

// Virtual for masked API token (for display)
platformSchema.virtual('maskedApiToken').get(function () {
    if (!this.apiToken) return '';
    if (this.apiToken.length <= 8) return '*'.repeat(this.apiToken.length);
    return this.apiToken.substring(0, 4) + '*'.repeat(this.apiToken.length - 8) + this.apiToken.substring(this.apiToken.length - 4);
});

// Method to test platform connection
platformSchema.methods.testConnection = async function () {
    try {
        let testResult = { success: false, message: '', details: {} };

        switch (this.type) {
            case 'apify':
                testResult = await this.testApifyConnection();
                break;
            case 'scrapingbee':
                testResult = await this.testScrapingBeeConnection();
                break;
            case 'brightdata':
                testResult = await this.testBrightDataConnection();
                break;
            default:
                testResult = { success: false, message: 'Platform type not supported for testing' };
        }

        // Update test status
        this.lastTested = new Date();
        this.testStatus = testResult.success ? 'success' : 'error';
        this.testMessage = testResult.message;

        await this.save();

        return testResult;
    } catch (error) {
        this.lastTested = new Date();
        this.testStatus = 'error';
        this.testMessage = error.message;
        await this.save();

        return {
            success: false,
            message: error.message,
            details: {}
        };
    }
};

// Test Apify connection
platformSchema.methods.testApifyConnection = async function () {
    try {
        const axios = require('axios');
        const response = await axios.get('https://api.apify.com/v2/users/me', {
            headers: {
                'Authorization': `Bearer ${this.apiToken}`
            },
            timeout: 10000
        });

        return {
            success: true,
            message: 'Apify connection successful',
            details: {
                userInfo: response.data,
                totalActors: response.data.actorRuns || 0
            }
        };
    } catch (error) {
        return {
            success: false,
            message: `Apify connection failed: ${error.response?.data?.message || error.message}`,
            details: {}
        };
    }
};

// Test ScrapingBee connection
platformSchema.methods.testScrapingBeeConnection = async function () {
    try {
        const axios = require('axios');
        const response = await axios.get('https://app.scrapingbee.com/api/v1/account', {
            headers: {
                'X-API-KEY': this.apiToken
            },
            timeout: 10000
        });

        return {
            success: true,
            message: 'ScrapingBee connection successful',
            details: {
                accountInfo: response.data
            }
        };
    } catch (error) {
        return {
            success: false,
            message: `ScrapingBee connection failed: ${error.response?.data?.message || error.message}`,
            details: {}
        };
    }
};

// Test Bright Data connection
platformSchema.methods.testBrightDataConnection = async function () {
    try {
        const axios = require('axios');
        const response = await axios.get('https://brightdata.com/api/account', {
            headers: {
                'Authorization': `Bearer ${this.apiToken}`
            },
            timeout: 10000
        });

        return {
            success: true,
            message: 'Bright Data connection successful',
            details: {
                accountInfo: response.data
            }
        };
    } catch (error) {
        return {
            success: false,
            message: `Bright Data connection failed: ${error.response?.data?.message || error.message}`,
            details: {}
        };
    }
};

// Pre-save middleware
platformSchema.pre('save', function (next) {
    // Auto-generate baseURL if not provided
    if (!this.baseURL) {
        switch (this.type) {
            case 'apify':
                this.baseURL = 'https://api.apify.com/v2';
                break;
            case 'scrapingbee':
                this.baseURL = 'https://app.scrapingbee.com/api/v1';
                break;
            case 'brightdata':
                this.baseURL = 'https://brightdata.com/api';
                break;
        }
    }

    next();
});

module.exports = mongoose.model('Platform', platformSchema);

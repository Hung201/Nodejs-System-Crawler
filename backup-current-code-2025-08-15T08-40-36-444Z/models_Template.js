const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên template là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên template không được quá 100 ký tự']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },
    website: {
        type: String,
        required: [true, 'Tên website là bắt buộc'],
        trim: true
    },
    urlPattern: {
        type: String,
        required: [true, 'URL pattern là bắt buộc'],
        trim: true
        // Ví dụ: "*.shopee.vn/*", "*.tiki.vn/*"
    },
    category: {
        type: String,
        enum: ['ecommerce', 'news', 'blog', 'social', 'other'],
        default: 'ecommerce'
    },
    // Actor information
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Actor',
        required: true
    },
    actorType: {
        type: String,
        required: true,
        trim: true
        // Ví dụ: "product-extractor", "news-scraper", etc.
    },
    // Input configuration - contains all scraping configuration
    input: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Input configuration là bắt buộc']
        // Flexible structure for different actor types
        // Example for product extractor:
        // {
        //     "url": "https://example.com/products",
        //     "paginationPattern": "?page=",
        //     "pageStart": 1,
        //     "pageEnd": 2,
        //     "productLinkSelector": ".product-card a",
        //     "productLinkIncludePatterns": ["/products/"],
        //     "productLinkExcludePatterns": ["about", "contact"],
        //     "titleClass": "h1, .product-title",
        //     "descriptionClass": ".product-description",
        //     "priceClass": ".price",
        //     "skuClass": "",
        //     "contentClass": ".content",
        //     "thumbnailClass": ".thumbnail img",
        //     "imagesClass": ".gallery img",
        //     "includePatterns": [],
        //     "excludePatterns": ["thumb", "small"],
        //     "skuInImage": false,
        //     "autoGenerateSku": true,
        //     "websiteName": "EXAMPLE",
        //     "isPrice": true,
        //     "isThumbnail": true,
        //     "category": "Electronics",
        //     "supplier": "EXAMPLE",
        //     "url_supplier": "https://example.com",
        //     "maxRequestsPerCrawl": 50000,
        //     "maxProductLinks": 50,
        //     "isBrowser": false
        // }
    },
    filters: {
        priceMin: {
            type: Number,
            default: null
        },
        priceMax: {
            type: Number,
            default: null
        },
        ratingMin: {
            type: Number,
            default: null
        },
        categories: [{
            type: String,
            trim: true
        }],
        brands: [{
            type: String,
            trim: true
        }]
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'testing'],
        default: 'active'
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    successRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    totalUses: {
        type: Number,
        default: 0
    },
    lastUsed: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    version: {
        type: String,
        default: '1.0.0'
    }
}, {
    timestamps: true
});

// Indexes
templateSchema.index({ website: 1, status: 1 });
templateSchema.index({ category: 1, status: 1 });
templateSchema.index({ isPublic: 1, status: 1 });
templateSchema.index({ createdBy: 1 });
templateSchema.index({ actorId: 1 });
templateSchema.index({ actorType: 1 });
templateSchema.index({ tags: 1 });

// Virtual for full URL pattern
templateSchema.virtual('fullUrlPattern').get(function () {
    return `https://${this.urlPattern}`;
});

// Method to check if URL matches pattern
templateSchema.methods.matchesUrl = function (url) {
    try {
        const pattern = this.urlPattern.replace(/\*/g, '.*');
        const regex = new RegExp(pattern, 'i');
        return regex.test(url);
    } catch (error) {
        return false;
    }
};

// Method to increment usage
templateSchema.methods.incrementUsage = function () {
    this.totalUses += 1;
    this.lastUsed = new Date();
    return this.save();
};

// Method to get input configuration
templateSchema.methods.getInputConfig = function () {
    return this.input || {};
};

// Method to update input configuration
templateSchema.methods.updateInputConfig = function (newInput) {
    this.input = { ...this.input, ...newInput };
    return this.save();
};

// Static method to find template for URL
templateSchema.statics.findForUrl = async function (url) {
    const templates = await this.find({
        status: 'active',
        isPublic: true
    });

    for (const template of templates) {
        if (template.matchesUrl(url)) {
            return template;
        }
    }

    return null;
};

// Static method to find templates by actor type
templateSchema.statics.findByActorType = async function (actorType) {
    return await this.find({
        actorType: actorType,
        status: 'active',
        isPublic: true
    }).populate('actorId', 'name description');
};

// Pre-save middleware
templateSchema.pre('save', function (next) {
    // Auto-generate tags if not provided
    if (!this.tags || this.tags.length === 0) {
        this.tags = [this.category, this.website];
    }

    next();
});

module.exports = mongoose.model('Template', templateSchema);

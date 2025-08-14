const Template = require('../models/Template');
const Actor = require('../models/Actor');

// Get all templates with pagination and filters
const getAllTemplates = async (filters) => {
    const { page = 1, limit = 10, status, category, search, isPublic, actorType } = filters;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (isPublic !== undefined) filter.isPublic = isPublic;
    if (actorType) filter.actorType = actorType;
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { website: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
        ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const templates = await Template.find(filter)
        .populate('createdBy', 'name email')
        .populate('actorId', 'name description')
        .sort({ totalUses: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const total = await Template.countDocuments(filter);

    return {
        templates,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    };
};

// Get template by ID
const getTemplateById = async (templateId) => {
    const template = await Template.findById(templateId)
        .populate('createdBy', 'name email')
        .populate('actorId', 'name description');

    if (!template) {
        throw new Error('Không tìm thấy template');
    }

    return template;
};

// Create new template
const createTemplate = async (templateData, createdBy) => {
    const {
        name,
        description,
        website,
        urlPattern,
        category,
        actorId,
        actorType,
        input,
        filters,
        isPublic,
        tags
    } = templateData;

    // Check if template with same name exists
    const existingTemplate = await Template.findOne({
        name: name,
        createdBy: createdBy
    });

    if (existingTemplate) {
        throw new Error('Template với tên này đã tồn tại');
    }

    // Validate actor exists
    if (actorId) {
        const actor = await Actor.findById(actorId);
        if (!actor) {
            throw new Error('Actor không tồn tại');
        }
    }

    const template = new Template({
        name,
        description,
        website,
        urlPattern,
        category,
        actorId,
        actorType,
        input,
        filters,
        isPublic,
        tags,
        createdBy
    });

    await template.save();

    // Populate references
    await template.populate('createdBy', 'name email');
    await template.populate('actorId', 'name description');

    return template;
};

// Update template
const updateTemplate = async (templateId, updateData, userId) => {
    const template = await Template.findById(templateId);

    if (!template) {
        throw new Error('Không tìm thấy template');
    }

    // Check if user owns the template or template is public
    if (template.createdBy.toString() !== userId && !template.isPublic) {
        throw new Error('Không có quyền chỉnh sửa template này');
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
        if (key !== 'createdBy' && template.schema.paths[key]) {
            template[key] = updateData[key];
        }
    });

    await template.save();

    // Populate references
    await template.populate('createdBy', 'name email');
    await template.populate('actorId', 'name description');

    return template;
};

// Delete template
const deleteTemplate = async (templateId, userId) => {
    const template = await Template.findById(templateId);

    if (!template) {
        throw new Error('Không tìm thấy template');
    }

    // Check if user owns the template
    if (template.createdBy.toString() !== userId) {
        throw new Error('Không có quyền xóa template này');
    }

    await Template.findByIdAndDelete(templateId);
    return { message: 'Template đã được xóa thành công' };
};

// Find template for URL
const findTemplateForUrl = async (url) => {
    const template = await Template.findForUrl(url);
    return template;
};

// Get available actors for template creation
const getAvailableActors = async () => {
    const actors = await Actor.find({ status: { $in: ['active', 'ready'] } })
        .select('name description type category')
        .sort({ name: 1 })
        .lean();

    return actors;
};

// Get actor schema for template creation
const getActorSchema = async (actorId) => {
    const actor = await Actor.findById(actorId);

    if (!actor) {
        throw new Error('Actor không tồn tại');
    }

    // Define schema based on actor type
    const schemas = {
        'product-extractor': {
            fields: [
                {
                    name: 'url',
                    label: 'URL',
                    type: 'url',
                    required: true,
                    placeholder: 'https://example.com/products',
                    description: 'Category or product page URL to start crawling'
                },
                {
                    name: 'paginationPattern',
                    label: 'Pagination Pattern',
                    type: 'text',
                    required: false,
                    placeholder: '?page=',
                    description: 'Pattern for pagination URLs'
                },
                {
                    name: 'pageStart',
                    label: 'Page Start',
                    type: 'number',
                    required: false,
                    default: 1,
                    min: 1,
                    description: 'Starting page number'
                },
                {
                    name: 'pageEnd',
                    label: 'Page End',
                    type: 'number',
                    required: false,
                    default: 1,
                    min: 1,
                    description: 'Ending page number'
                },
                {
                    name: 'productLinkSelector',
                    label: 'Product Link Selector',
                    type: 'text',
                    required: true,
                    placeholder: '.product-card a',
                    description: 'CSS selector for product links'
                },
                {
                    name: 'productLinkIncludePatterns',
                    label: 'Product Link Include Patterns',
                    type: 'array',
                    required: false,
                    placeholder: '["/products/"]',
                    description: 'Patterns that product links must contain'
                },
                {
                    name: 'productLinkExcludePatterns',
                    label: 'Product Link Exclude Patterns',
                    type: 'array',
                    required: false,
                    placeholder: '["about", "contact"]',
                    description: 'Patterns that product links must not contain'
                },
                {
                    name: 'titleClass',
                    label: 'Title Selector',
                    type: 'text',
                    required: true,
                    placeholder: 'h1, .product-title',
                    description: 'CSS selector for product title'
                },
                {
                    name: 'descriptionClass',
                    label: 'Description Selector',
                    type: 'text',
                    required: false,
                    placeholder: '.product-description',
                    description: 'CSS selector for product description'
                },
                {
                    name: 'priceClass',
                    label: 'Price Selector',
                    type: 'text',
                    required: false,
                    placeholder: '.price',
                    description: 'CSS selector for product price'
                },
                {
                    name: 'skuClass',
                    label: 'SKU Selector',
                    type: 'text',
                    required: false,
                    placeholder: '',
                    description: 'CSS selector for SKU (leave empty for auto-generate)'
                },
                {
                    name: 'contentClass',
                    label: 'Content Selector',
                    type: 'text',
                    required: false,
                    placeholder: '.content',
                    description: 'CSS selector for product content'
                },
                {
                    name: 'thumbnailClass',
                    label: 'Thumbnail Selector',
                    type: 'text',
                    required: false,
                    placeholder: '.thumbnail img',
                    description: 'CSS selector for product thumbnail'
                },
                {
                    name: 'imagesClass',
                    label: 'Images Selector',
                    type: 'text',
                    required: false,
                    placeholder: '.gallery img',
                    description: 'CSS selector for product images'
                },
                {
                    name: 'includePatterns',
                    label: 'Include Patterns',
                    type: 'array',
                    required: false,
                    placeholder: '[]',
                    description: 'Patterns that images must contain'
                },
                {
                    name: 'excludePatterns',
                    label: 'Exclude Patterns',
                    type: 'array',
                    required: false,
                    placeholder: '["thumb", "small"]',
                    description: 'Patterns that images must not contain'
                },
                {
                    name: 'websiteName',
                    label: 'Website Name',
                    type: 'text',
                    required: true,
                    placeholder: 'EXAMPLE',
                    description: 'Website name for SKU generation'
                },
                {
                    name: 'category',
                    label: 'Category',
                    type: 'text',
                    required: false,
                    placeholder: 'Electronics',
                    description: 'Product category'
                },
                {
                    name: 'supplier',
                    label: 'Supplier',
                    type: 'text',
                    required: false,
                    placeholder: 'EXAMPLE',
                    description: 'Product supplier'
                },
                {
                    name: 'url_supplier',
                    label: 'Supplier URL',
                    type: 'url',
                    required: false,
                    placeholder: 'https://example.com',
                    description: 'Supplier website URL'
                },
                {
                    name: 'maxRequestsPerCrawl',
                    label: 'Max Requests Per Crawl',
                    type: 'number',
                    required: false,
                    default: 50000,
                    min: 1,
                    description: 'Maximum number of requests per crawl'
                },
                {
                    name: 'maxProductLinks',
                    label: 'Max Product Links',
                    type: 'number',
                    required: false,
                    default: 50,
                    min: 1,
                    description: 'Maximum number of product links to crawl'
                }
            ]
        }
        // Add more actor types here
    };

    return {
        actor,
        schema: schemas[actor.type] || schemas['product-extractor']
    };
};

// Create template from actor
const createTemplateFromActor = async (actorId, templateData, createdBy) => {
    const actor = await Actor.findById(actorId);

    if (!actor) {
        throw new Error('Actor không tồn tại');
    }

    const template = new Template({
        name: templateData.name,
        description: templateData.description,
        website: templateData.website,
        urlPattern: templateData.urlPattern,
        category: templateData.category,
        actorId: actorId,
        actorType: actor.type,
        input: templateData.input,
        isPublic: templateData.isPublic || true,
        tags: templateData.tags,
        createdBy
    });

    await template.save();
    await template.populate('createdBy', 'name email');
    await template.populate('actorId', 'name description');

    return template;
};

// Get template statistics
const getTemplateStats = async () => {
    const stats = await Template.aggregate([
        {
            $group: {
                _id: null,
                totalTemplates: { $sum: 1 },
                activeTemplates: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                },
                publicTemplates: {
                    $sum: { $cond: ['$isPublic', 1, 0] }
                },
                totalUses: { $sum: '$totalUses' },
                avgSuccessRate: { $avg: '$successRate' }
            }
        }
    ]);

    const categoryStats = await Template.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalUses: { $sum: '$totalUses' }
            }
        },
        { $sort: { count: -1 } }
    ]);

    const actorTypeStats = await Template.aggregate([
        {
            $group: {
                _id: '$actorType',
                count: { $sum: 1 },
                totalUses: { $sum: '$totalUses' }
            }
        },
        { $sort: { count: -1 } }
    ]);

    const websiteStats = await Template.aggregate([
        {
            $group: {
                _id: '$website',
                count: { $sum: 1 },
                totalUses: { $sum: '$totalUses' }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    return {
        overall: stats[0] || {
            totalTemplates: 0,
            activeTemplates: 0,
            publicTemplates: 0,
            totalUses: 0,
            avgSuccessRate: 0
        },
        byCategory: categoryStats,
        byActorType: actorTypeStats,
        byWebsite: websiteStats
    };
};

// Get popular templates
const getPopularTemplates = async (limit = 10) => {
    const templates = await Template.find({
        status: 'active',
        isPublic: true
    })
        .sort({ totalUses: -1, successRate: -1 })
        .limit(limit)
        .populate('createdBy', 'name')
        .populate('actorId', 'name')
        .lean();

    return templates;
};

// Test template with URL
const testTemplate = async (templateId, testUrl) => {
    const template = await Template.findById(templateId);

    if (!template) {
        throw new Error('Không tìm thấy template');
    }

    // Check if URL matches pattern
    const matches = template.matchesUrl(testUrl);

    return {
        template,
        testUrl,
        matches,
        input: template.input,
        selectors: template.selectors,
        config: template.config
    };
};

// Clone template
const cloneTemplate = async (templateId, userId, newName) => {
    const originalTemplate = await Template.findById(templateId);

    if (!originalTemplate) {
        throw new Error('Không tìm thấy template');
    }

    // Check if template is public or user owns it
    if (!originalTemplate.isPublic && originalTemplate.createdBy.toString() !== userId) {
        throw new Error('Không có quyền clone template này');
    }

    const clonedTemplate = new Template({
        name: newName || `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        website: originalTemplate.website,
        urlPattern: originalTemplate.urlPattern,
        category: originalTemplate.category,
        actorId: originalTemplate.actorId,
        actorType: originalTemplate.actorType,
        input: originalTemplate.input,
        selectors: originalTemplate.selectors,
        filters: originalTemplate.filters,
        config: originalTemplate.config,
        isPublic: false, // Cloned templates are private by default
        tags: [...originalTemplate.tags, 'cloned'],
        createdBy: userId,
        version: '1.0.0'
    });

    await clonedTemplate.save();
    await clonedTemplate.populate('createdBy', 'name email');
    await clonedTemplate.populate('actorId', 'name description');

    return clonedTemplate;
};

// Update template success rate
const updateTemplateSuccessRate = async (templateId, successRate) => {
    const template = await Template.findById(templateId);

    if (!template) {
        throw new Error('Không tìm thấy template');
    }

    template.successRate = successRate;
    await template.save();

    return template;
};

// Search templates by tags
const searchTemplatesByTags = async (tags, limit = 20) => {
    const templates = await Template.find({
        tags: { $in: tags },
        status: 'active',
        isPublic: true
    })
        .sort({ totalUses: -1, successRate: -1 })
        .limit(limit)
        .populate('createdBy', 'name')
        .populate('actorId', 'name')
        .lean();

    return templates;
};

// Find templates by actor type
const findTemplatesByActorType = async (actorType) => {
    const templates = await Template.findByActorType(actorType);
    return templates;
};

module.exports = {
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    findTemplateForUrl,
    getAvailableActors,
    getActorSchema,
    createTemplateFromActor,
    getTemplateStats,
    getPopularTemplates,
    testTemplate,
    cloneTemplate,
    updateTemplateSuccessRate,
    searchTemplatesByTags,
    findTemplatesByActorType
};

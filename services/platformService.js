const Platform = require('../models/Platform');

// Get all platforms for a user with statistics
const getAllPlatforms = async (userId, filters = {}) => {
    const { type, isActive, search, includeStats = false } = filters;

    // Build filter
    const filter = { userId };
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const platforms = await Platform.find(filter)
        .sort({ createdAt: -1 })
        .lean();

    // Nếu không yêu cầu thống kê, chỉ trả về platforms
    if (!includeStats) {
        return platforms;
    }

    // Tính toán thống kê
    const stats = {
        totalPlatforms: platforms.length,
        activePlatforms: platforms.filter(p => p.isActive).length,
        successfulConnections: platforms.filter(p => p.testStatus === 'success').length,
        failedConnections: platforms.filter(p => p.testStatus === 'error').length
    };

    return {
        platforms,
        statistics: stats
    };
};

// Get platform by ID
const getPlatformById = async (platformId, userId) => {
    const platform = await Platform.findOne({
        _id: platformId,
        userId: userId
    });

    if (!platform) {
        throw new Error('Không tìm thấy platform');
    }

    return platform;
};

// Create new platform
const createPlatform = async (platformData, userId) => {
    const {
        name,
        type,
        description,
        apiToken,
        baseURL,
        isActive,
        config
    } = platformData;

    // Check if platform with same name exists for this user
    const existingPlatform = await Platform.findOne({
        name: name,
        userId: userId
    });

    if (existingPlatform) {
        throw new Error('Platform với tên này đã tồn tại');
    }

    const platform = new Platform({
        name,
        type,
        description,
        apiToken,
        baseURL,
        isActive: isActive !== undefined ? isActive : true,
        config: config || {},
        userId
    });

    await platform.save();
    return platform;
};

// Update platform
const updatePlatform = async (platformId, updateData, userId) => {
    const platform = await Platform.findOne({
        _id: platformId,
        userId: userId
    });

    if (!platform) {
        throw new Error('Không tìm thấy platform');
    }

    // Check if name is being updated and if it conflicts
    if (updateData.name && updateData.name !== platform.name) {
        const existingPlatform = await Platform.findOne({
            name: updateData.name,
            userId: userId,
            _id: { $ne: platformId }
        });

        if (existingPlatform) {
            throw new Error('Platform với tên này đã tồn tại');
        }
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
        if (key !== 'userId' && platform.schema.paths[key]) {
            platform[key] = updateData[key];
        }
    });

    await platform.save();
    return platform;
};

// Delete platform
const deletePlatform = async (platformId, userId) => {
    const platform = await Platform.findOne({
        _id: platformId,
        userId: userId
    });

    if (!platform) {
        throw new Error('Không tìm thấy platform');
    }

    await Platform.findByIdAndDelete(platformId);
    return { message: 'Platform đã được xóa thành công' };
};

// Test platform connection
const testPlatformConnection = async (platformId, userId) => {
    const platform = await Platform.findOne({
        _id: platformId,
        userId: userId
    });

    if (!platform) {
        throw new Error('Không tìm thấy platform');
    }

    const testResult = await platform.testConnection();
    return testResult;
};

// Get platform statistics
const getPlatformStats = async (userId) => {
    const stats = await Platform.aggregate([
        { $match: { userId: userId } },
        {
            $group: {
                _id: null,
                totalPlatforms: { $sum: 1 },
                activePlatforms: {
                    $sum: { $cond: ['$isActive', 1, 0] }
                },
                platformsByType: {
                    $push: {
                        type: '$type',
                        name: '$name',
                        isActive: '$isActive',
                        testStatus: '$testStatus'
                    }
                }
            }
        }
    ]);

    const typeStats = await Platform.aggregate([
        { $match: { userId: userId } },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                activeCount: {
                    $sum: { $cond: ['$isActive', 1, 0] }
                },
                successCount: {
                    $sum: { $cond: [{ $eq: ['$testStatus', 'success'] }, 1, 0] }
                }
            }
        },
        { $sort: { count: -1 } }
    ]);

    return {
        overall: stats[0] || {
            totalPlatforms: 0,
            activePlatforms: 0,
            platformsByType: []
        },
        byType: typeStats
    };
};

// Get available platform types
const getAvailablePlatformTypes = () => {
    return [
        {
            value: 'apify',
            label: 'Apify',
            description: 'Web scraping and automation platform',
            baseURL: 'https://api.apify.com/v2',
            icon: '🔧'
        },
        {
            value: 'scrapingbee',
            label: 'ScrapingBee',
            description: 'Web scraping API service',
            baseURL: 'https://app.scrapingbee.com/api/v1',
            icon: '🐝'
        },
        {
            value: 'brightdata',
            label: 'Bright Data',
            description: 'Data collection platform',
            baseURL: 'https://brightdata.com/api',
            icon: '💡'
        },
        {
            value: 'scrapingant',
            label: 'ScrapingAnt',
            description: 'Web scraping API',
            baseURL: 'https://api.scrapingant.com',
            icon: '🐜'
        },
        {
            value: 'other',
            label: 'Other',
            description: 'Custom platform',
            baseURL: '',
            icon: '⚙️'
        }
    ];
};

// Bulk test all platforms for a user
const testAllPlatforms = async (userId) => {
    const platforms = await Platform.find({ userId: userId });
    const results = [];

    for (const platform of platforms) {
        try {
            const testResult = await platform.testConnection();
            results.push({
                platformId: platform._id,
                platformName: platform.name,
                platformType: platform.type,
                success: testResult.success,
                message: testResult.message,
                details: testResult.details
            });
        } catch (error) {
            results.push({
                platformId: platform._id,
                platformName: platform.name,
                platformType: platform.type,
                success: false,
                message: error.message,
                details: {}
            });
        }
    }

    return results;
};

module.exports = {
    getAllPlatforms,
    getPlatformById,
    createPlatform,
    updatePlatform,
    deletePlatform,
    testPlatformConnection,
    getPlatformStats,
    getAvailablePlatformTypes,
    testAllPlatforms
};

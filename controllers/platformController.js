const platformService = require('../services/platformService');

// Get all platforms for current user
const getAllPlatforms = async (req, res) => {
    try {
        const filters = {
            type: req.query.type,
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
            search: req.query.search
        };

        const platforms = await platformService.getAllPlatforms(req.user.userId, filters);

        res.json({
            success: true,
            data: platforms
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get platform by ID
const getPlatformById = async (req, res) => {
    try {
        const platform = await platformService.getPlatformById(req.params.id, req.user.userId);

        res.json({
            success: true,
            data: platform
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
};

// Create new platform
const createPlatform = async (req, res) => {
    try {
        const platform = await platformService.createPlatform(req.body, req.user.userId);

        res.status(201).json({
            success: true,
            data: platform
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update platform
const updatePlatform = async (req, res) => {
    try {
        const platform = await platformService.updatePlatform(req.params.id, req.body, req.user.userId);

        res.json({
            success: true,
            data: platform
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete platform
const deletePlatform = async (req, res) => {
    try {
        const result = await platformService.deletePlatform(req.params.id, req.user.userId);

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Test platform connection
const testPlatformConnection = async (req, res) => {
    try {
        const testResult = await platformService.testPlatformConnection(req.params.id, req.user.userId);

        res.json({
            success: true,
            data: testResult
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get platform statistics
const getPlatformStats = async (req, res) => {
    try {
        const stats = await platformService.getPlatformStats(req.user.userId);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get available platform types
const getAvailablePlatformTypes = async (req, res) => {
    try {
        const platformTypes = platformService.getAvailablePlatformTypes();

        res.json({
            success: true,
            data: platformTypes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Test all platforms for current user
const testAllPlatforms = async (req, res) => {
    try {
        const results = await platformService.testAllPlatforms(req.user.userId);

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
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

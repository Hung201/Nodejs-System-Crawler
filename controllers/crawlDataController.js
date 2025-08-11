const crawlDataService = require('../services/crawlDataService');

// Get all crawl data with pagination and filters
const getAllCrawlData = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, status, campaignId, actorId, source } = req.query;

        // Build filters
        const filters = {};
        if (type) filters.type = type;
        if (status) filters.status = status;
        if (campaignId) filters.campaignId = campaignId;
        if (actorId) filters.actorId = actorId;
        if (source) filters.source = source;

        const data = await crawlDataService.getAllCrawlData(filters, { page, limit });

        res.json({
            success: true,
            data: data.data,
            pagination: data.pagination
        });
    } catch (error) {
        console.error('Error getting crawl data:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get crawl data by ID
const getCrawlDataById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await crawlDataService.getCrawlDataById(id);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error getting crawl data by ID:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get crawl data by campaign
const getCrawlDataByCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { type, status } = req.query;

        const filters = {};
        if (type) filters.type = type;
        if (status) filters.status = status;

        const data = await crawlDataService.getCrawlDataByCampaign(campaignId, filters);

        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Error getting crawl data by campaign:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get crawl data by type
const getCrawlDataByType = async (req, res) => {
    try {
        const { type } = req.params;
        const { status, campaignId, actorId } = req.query;

        const filters = {};
        if (status) filters.status = status;
        if (campaignId) filters.campaignId = campaignId;
        if (actorId) filters.actorId = actorId;

        const data = await crawlDataService.getCrawlDataByType(type, filters);

        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Error getting crawl data by type:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update crawl data status
const updateCrawlDataStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const userId = req.user.id; // Từ middleware auth

        const data = await crawlDataService.updateCrawlDataStatus(id, status, userId);

        // Update notes if provided
        if (notes) {
            data.notes = notes;
            await data.save();
        }

        res.json({
            success: true,
            data,
            message: `Đã cập nhật trạng thái thành ${status}`
        });
    } catch (error) {
        console.error('Error updating crawl data status:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete crawl data by campaign
const deleteCrawlDataByCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const result = await crawlDataService.deleteCrawlDataByCampaign(campaignId);

        res.json({
            success: true,
            message: `Đã xóa ${result.deletedCount} records`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting crawl data:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get statistics
const getCrawlDataStats = async (req, res) => {
    try {
        const { campaignId, actorId } = req.query;

        const filters = {};
        if (campaignId) filters.campaignId = campaignId;
        if (actorId) filters.actorId = actorId;

        const stats = await crawlDataService.getCrawlDataStats(filters);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting crawl data stats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllCrawlData,
    getCrawlDataById,
    getCrawlDataByCampaign,
    getCrawlDataByType,
    updateCrawlDataStatus,
    deleteCrawlDataByCampaign,
    getCrawlDataStats
};

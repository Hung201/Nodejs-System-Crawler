const campaignService = require('../services/campaignService');
const { validationResult } = require('express-validator');

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Private
const getAllCampaigns = async (req, res) => {
    try {
        const filters = req.query;
        const result = await campaignService.getAllCampaigns(filters);
        res.json({
            success: true,
            data: result.campaigns,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error getting campaigns:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi lấy danh sách campaigns'
        });
    }
};

// @desc    Get campaign by ID
// @route   GET /api/campaigns/:id
// @access  Private
const getCampaignById = async (req, res) => {
    try {
        const campaign = await campaignService.getCampaignById(req.params.id);
        res.json({
            success: true,
            data: campaign
        });
    } catch (error) {
        console.error('Error getting campaign:', error);
        res.status(404).json({
            success: false,
            error: error.message || 'Lỗi server khi lấy thông tin campaign'
        });
    }
};

// @desc    Create new campaign
// @route   POST /api/campaigns
// @access  Private
const createCampaign = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Dữ liệu không hợp lệ',
                details: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg,
                    value: err.value
                }))
            });
        }

        const campaign = await campaignService.createCampaign(req.body, req.user.id);
        res.status(201).json({
            success: true,
            data: campaign
        });
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi tạo campaign'
        });
    }
};

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private
const updateCampaign = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Dữ liệu không hợp lệ',
                details: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg,
                    value: err.value
                }))
            });
        }

        const campaign = await campaignService.updateCampaign(req.params.id, req.body);
        res.json({
            success: true,
            data: campaign
        });
    } catch (error) {
        console.error('Error updating campaign:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi cập nhật campaign'
        });
    }
};

// @desc    Run campaign
// @route   POST /api/campaigns/:id/run
// @access  Private
const runCampaign = async (req, res) => {
    try {
        const result = await campaignService.runCampaign(req.params.id);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error running campaign:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi chạy campaign'
        });
    }
};

// @desc    Get campaign run status
// @route   GET /api/campaigns/:id/status
// @access  Private
const getCampaignStatus = async (req, res) => {
    try {
        const result = await campaignService.getCampaignStatus(req.params.id);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error getting campaign status:', error);
        res.status(404).json({
            success: false,
            error: error.message || 'Lỗi server khi lấy trạng thái campaign'
        });
    }
};

// @desc    Cancel campaign
// @route   POST /api/campaigns/:id/cancel
// @access  Private
const cancelCampaign = async (req, res) => {
    try {
        const result = await campaignService.cancelCampaign(req.params.id);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error cancelling campaign:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi hủy campaign'
        });
    }
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
const deleteCampaign = async (req, res) => {
    try {
        const result = await campaignService.deleteCampaign(req.params.id);
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi xóa campaign'
        });
    }
};



module.exports = {
    getAllCampaigns,
    getCampaignById,
    createCampaign,
    updateCampaign,
    runCampaign,
    getCampaignStatus,
    cancelCampaign,
    deleteCampaign
};

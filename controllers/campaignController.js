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

// @desc    Get campaigns by actor
// @route   GET /api/campaigns/actor/:actorId
// @access  Private
const getCampaignsByActor = async (req, res) => {
    try {
        const { actorId } = req.params;
        const filters = {
            ...req.query,
            actorId: actorId
        };

        const result = await campaignService.getAllCampaigns(filters);
        res.json({
            success: true,
            data: result.campaigns,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error getting campaigns by actor:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi lấy danh sách campaigns theo actor'
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
        // Nhận custom input từ request body nếu có
        const customInput = req.body.input || null;

        const result = await campaignService.runCampaign(req.params.id, customInput);
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

// @desc    Reset campaign status
// @route   POST /api/campaigns/:id/reset
// @access  Private
const resetCampaign = async (req, res) => {
    try {
        const result = await campaignService.resetCampaign(req.params.id);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error resetting campaign:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Lỗi server khi reset campaign'
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

// @desc    Emergency cleanup all node processes
// @route   POST /api/campaigns/cleanup
// @access  Private (Admin only)
const cleanupProcesses = async (req, res) => {
    try {
        console.log('🚨 Emergency cleanup requested by user:', req.user.email);
        campaignService.cleanupAllNodeProcesses();

        res.json({
            success: true,
            message: 'Emergency cleanup initiated. All node processes will be terminated.'
        });
    } catch (error) {
        console.error('Error during emergency cleanup:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi thực hiện emergency cleanup'
        });
    }
};

// @desc    Run multiple campaigns simultaneously
// @route   POST /api/campaigns/run-multiple
// @access  Private
const runMultipleCampaigns = async (req, res) => {
    try {
        const { campaignIds, customInputs } = req.body;

        if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Danh sách campaign IDs là bắt buộc và phải là array'
            });
        }

        if (campaignIds.length > 10) {
            return res.status(400).json({
                success: false,
                error: 'Tối đa chỉ được chạy 10 campaigns cùng lúc'
            });
        }

        const result = await campaignService.runMultipleCampaigns(campaignIds, customInputs || {});
        res.json(result);
    } catch (error) {
        console.error('Error running multiple campaigns:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi chạy nhiều campaigns'
        });
    }
};

// @desc    Get all running campaigns status
// @route   GET /api/campaigns/running/status
// @access  Private
const getRunningCampaigns = async (req, res) => {
    try {
        const result = await campaignService.getRunningCampaigns();
        res.json(result);
    } catch (error) {
        console.error('Error getting running campaigns:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi lấy trạng thái campaigns đang chạy'
        });
    }
};

// @desc    Stop all running campaigns
// @route   POST /api/campaigns/running/stop-all
// @access  Private
const stopAllRunningCampaigns = async (req, res) => {
    try {
        const result = await campaignService.stopAllRunningCampaigns();
        res.json(result);
    } catch (error) {
        console.error('Error stopping all running campaigns:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi server khi dừng tất cả campaigns'
        });
    }
};

module.exports = {
    getAllCampaigns,
    getCampaignsByActor,
    getCampaignById,
    createCampaign,
    updateCampaign,
    runCampaign,
    getCampaignStatus,
    cancelCampaign,
    resetCampaign,
    deleteCampaign,
    cleanupProcesses,
    runMultipleCampaigns,
    getRunningCampaigns,
    stopAllRunningCampaigns
};

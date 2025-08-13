const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const portManager = require('../services/portManager');

// GET /api/ports/stats - Lấy thống kê ports
router.get('/stats', auth, async (req, res) => {
    try {
        const stats = portManager.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/ports/campaigns - Lấy danh sách campaigns và ports
router.get('/campaigns', auth, async (req, res) => {
    try {
        const campaigns = portManager.getCampaignPorts();
        res.json({
            success: true,
            data: campaigns
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/ports/campaign/:campaignId - Lấy port của campaign cụ thể
router.get('/campaign/:campaignId', auth, async (req, res) => {
    try {
        const { campaignId } = req.params;
        const port = portManager.getCampaignPort(campaignId);

        if (port) {
            res.json({
                success: true,
                data: {
                    campaignId,
                    port,
                    isActive: portManager.isCampaignUsingPort(campaignId)
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Campaign không có port được cấp phát'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST /api/ports/release/:campaignId - Giải phóng port của campaign
router.post('/release/:campaignId', auth, async (req, res) => {
    try {
        const { campaignId } = req.params;
        const releasedPort = portManager.releasePort(campaignId);

        if (releasedPort) {
            res.json({
                success: true,
                message: `Đã giải phóng port ${releasedPort} từ campaign ${campaignId}`,
                data: {
                    campaignId,
                    releasedPort
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Campaign không có port để giải phóng'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST /api/ports/cleanup - Cleanup tất cả ports (emergency)
router.post('/cleanup', auth, async (req, res) => {
    try {
        await portManager.cleanupAllPorts();
        res.json({
            success: true,
            message: 'Đã cleanup tất cả campaign ports'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/ports/health/:port - Kiểm tra health của port
router.get('/health/:port', auth, async (req, res) => {
    try {
        const { port } = req.params;
        const isHealthy = await portManager.checkPortHealth(port);

        res.json({
            success: true,
            data: {
                port: parseInt(port),
                isHealthy,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

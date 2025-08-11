const express = require('express');
const router = express.Router();
const crawlDataController = require('../controllers/crawlDataController');
const { auth } = require('../middleware/auth');

// Tất cả routes đều yêu cầu authentication
router.use(auth);

// GET /api/crawl-data - Lấy tất cả dữ liệu crawl với pagination và filters
router.get('/', crawlDataController.getAllCrawlData);

// GET /api/crawl-data/stats - Lấy thống kê dữ liệu
router.get('/stats', crawlDataController.getCrawlDataStats);

// GET /api/crawl-data/:id - Lấy dữ liệu theo ID
router.get('/:id', crawlDataController.getCrawlDataById);

// GET /api/crawl-data/campaign/:campaignId - Lấy dữ liệu theo campaign
router.get('/campaign/:campaignId', crawlDataController.getCrawlDataByCampaign);

// GET /api/crawl-data/type/:type - Lấy dữ liệu theo loại
router.get('/type/:type', crawlDataController.getCrawlDataByType);

// PUT /api/crawl-data/:id/status - Cập nhật trạng thái dữ liệu
router.put('/:id/status', crawlDataController.updateCrawlDataStatus);

// DELETE /api/crawl-data/campaign/:campaignId - Xóa dữ liệu theo campaign
router.delete('/campaign/:campaignId', crawlDataController.deleteCrawlDataByCampaign);

module.exports = router;

const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const crawlDataController = require('../controllers/crawlDataController');

const router = express.Router();

// Get all crawl data with pagination and filters
router.get('/', auth, crawlDataController.getAllCrawlData);

// Get crawl data by ID
router.get('/:id', auth, crawlDataController.getCrawlDataById);

// Get crawl data by campaign
router.get('/campaign/:campaignId', auth, crawlDataController.getCrawlDataByCampaign);

// Get crawl data by type
router.get('/type/:type', auth, crawlDataController.getCrawlDataByType);

// Get statistics
router.get('/stats/overview', auth, crawlDataController.getCrawlDataStats);

// Update crawl data status (approve/reject)
router.put('/:id/approve', auth, authorize('admin', 'editor'), (req, res) => {
  req.body.status = 'approved';
  crawlDataController.updateCrawlDataStatus(req, res);
});

router.put('/:id/reject', auth, authorize('admin', 'editor'), (req, res) => {
  req.body.status = 'rejected';
  crawlDataController.updateCrawlDataStatus(req, res);
});

// Update status to translated
router.put('/:id/translate', auth, authorize('admin', 'editor'), (req, res) => {
  req.body.status = 'translated';
  crawlDataController.updateCrawlDataStatus(req, res);
});

// Update status manually
router.put('/:id/status', auth, authorize('admin', 'editor'), crawlDataController.updateCrawlDataStatus);

// Delete crawl data by campaign
router.delete('/campaign/:campaignId', auth, authorize('admin'), crawlDataController.deleteCrawlDataByCampaign);

module.exports = router; 
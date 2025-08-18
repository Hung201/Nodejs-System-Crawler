const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getStats,
  getChartData,
  getDataStatus,
  getRecentData,
  getDetailedStats
} = require('../controllers/dashboardController');

const router = express.Router();

// Lấy thống kê tổng quan dashboard
router.get('/stats', auth, getStats);

// Lấy dữ liệu biểu đồ (7 ngày qua)
router.get('/chart-data', auth, getChartData);

// Lấy trạng thái dữ liệu
router.get('/data-status', auth, getDataStatus);

// Lấy dữ liệu gần đây
router.get('/recent-data', auth, getRecentData);

// Lấy thống kê chi tiết
router.get('/detailed-stats', auth, getDetailedStats);

module.exports = router; 
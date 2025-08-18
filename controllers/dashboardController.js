const CrawlData = require('../models/CrawlData');
const User = require('../models/User');
const Actor = require('../models/Actor');
const Source = require('../models/Source');
const Campaign = require('../models/Campaign');
const logger = require('../utils/logger');

// Lấy thống kê tổng quan
const getStats = async (req, res) => {
    try {
        // Đếm tổng dữ liệu
        const totalData = await CrawlData.countDocuments();

        // Đếm nguồn crawl
        const totalSources = await Source.countDocuments();

        // Đếm người dùng
        const totalUsers = await User.countDocuments({ status: 'active' });

        // Đếm actor đang chạy
        const runningActors = await Actor.countDocuments({
            'runInfo.runStatus': 'running'
        });

        // Tính phần trăm thay đổi so với tháng trước
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const lastMonthData = await CrawlData.countDocuments({
            createdAt: { $gte: lastMonth }
        });

        const dataChange = totalData > 0 ? Math.round(((totalData - lastMonthData) / totalData) * 100) : 0;

        res.json({
            success: true,
            data: {
                totalData: {
                    value: totalData,
                    change: `${dataChange > 0 ? '+' : ''}${dataChange}% so với tháng trước`
                },
                totalSources: {
                    value: totalSources,
                    change: `+${totalSources} so với tháng trước`
                },
                totalUsers: {
                    value: totalUsers,
                    change: `+${totalUsers} so với tháng trước`
                },
                runningActors: {
                    value: runningActors,
                    change: runningActors > 0 ? `-${runningActors} so với tháng trước` : '0 so với tháng trước'
                }
            }
        });
    } catch (error) {
        logger.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê dashboard',
            error: error.message
        });
    }
};

// Lấy dữ liệu biểu đồ (7 ngày qua)
const getChartData = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Tạo mảng 7 ngày
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            days.push(date);
        }

        // Lấy dữ liệu theo từng ngày
        const chartData = await Promise.all(
            days.map(async (day) => {
                const nextDay = new Date(day);
                nextDay.setDate(nextDay.getDate() + 1);

                const count = await CrawlData.countDocuments({
                    createdAt: {
                        $gte: day,
                        $lt: nextDay
                    }
                });

                return {
                    date: day.toISOString().split('T')[0],
                    count: count
                };
            })
        );

        res.json({
            success: true,
            data: chartData
        });
    } catch (error) {
        logger.error('Error getting chart data:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu biểu đồ',
            error: error.message
        });
    }
};

// Lấy trạng thái dữ liệu
const getDataStatus = async (req, res) => {
    try {
        const statusCounts = await CrawlData.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Tạo object với tất cả trạng thái
        const statusMap = {
            pending: 0,
            translated: 0,
            approved: 0,
            rejected: 0
        };

        // Cập nhật số lượng từ kết quả aggregate
        statusCounts.forEach(item => {
            statusMap[item._id] = item.count;
        });

        res.json({
            success: true,
            data: {
                pending: statusMap.pending,
                translated: statusMap.translated,
                approved: statusMap.approved,
                rejected: statusMap.rejected
            }
        });
    } catch (error) {
        logger.error('Error getting data status:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy trạng thái dữ liệu',
            error: error.message
        });
    }
};

// Lấy dữ liệu gần đây
const getRecentData = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const recentData = await CrawlData.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('campaignId', 'name')
            .populate('actorId', 'name')
            .select('title description type source status createdAt');

        res.json({
            success: true,
            data: recentData
        });
    } catch (error) {
        logger.error('Error getting recent data:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu gần đây',
            error: error.message
        });
    }
};

// Lấy thống kê chi tiết
const getDetailedStats = async (req, res) => {
    try {
        // Thống kê theo loại dữ liệu
        const dataByType = await CrawlData.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Thống kê theo nguồn
        const dataBySource = await CrawlData.aggregate([
            {
                $group: {
                    _id: '$source',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Thống kê theo thời gian (24h, 7 ngày, 30 ngày)
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [last24h, last7Days, last30Days] = await Promise.all([
            CrawlData.countDocuments({ createdAt: { $gte: oneDayAgo } }),
            CrawlData.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
            CrawlData.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
        ]);

        res.json({
            success: true,
            data: {
                byType: dataByType,
                bySource: dataBySource,
                timeStats: {
                    last24h,
                    last7Days,
                    last30Days
                }
            }
        });
    } catch (error) {
        logger.error('Error getting detailed stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê chi tiết',
            error: error.message
        });
    }
};

module.exports = {
    getStats,
    getChartData,
    getDataStatus,
    getRecentData,
    getDetailedStats
};

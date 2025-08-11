const CrawlData = require('../models/CrawlData');

/**
 * Lưu dữ liệu sản phẩm
 */
const saveProductData = async (productData, campaignId, actorId) => {
    try {
        const crawlData = new CrawlData({
            title: productData.title,
            description: productData.description,
            content: productData.content,
            type: 'product',
            url: productData.url,
            source: productData.supplier || 'Unknown',
            sourceUrl: productData.url_supplier || '',
            thumbnail: productData.thumbnail,
            images: productData.images || [],
            metadata: {
                price: productData.price,
                sku: productData.sku,
                category: productData.category,
                supplier: productData.supplier
            },
            campaignId,
            actorId
        });

        const savedData = await crawlData.save();
        console.log(`✅ Đã lưu sản phẩm: ${savedData.title}`);
        return savedData;
    } catch (error) {
        console.error('❌ Lỗi khi lưu sản phẩm:', error.message);
        throw error;
    }
};

/**
 * Lưu dữ liệu video YouTube
 */
const saveVideoData = async (videoData, campaignId, actorId) => {
    try {
        const crawlData = new CrawlData({
            title: videoData.title,
            description: videoData.description,
            content: videoData.transcript || '',
            type: 'video',
            url: videoData.url,
            source: 'YouTube',
            sourceUrl: 'https://www.youtube.com',
            thumbnail: videoData.thumbnail,
            images: videoData.images || [videoData.thumbnail],
            metadata: {
                videoId: videoData.videoId,
                duration: videoData.duration,
                durationSeconds: videoData.durationSeconds,
                viewCount: videoData.viewCount,
                likeCount: videoData.likeCount,
                dislikeCount: videoData.dislikeCount,
                commentCount: videoData.commentCount,
                channelId: videoData.channelId,
                channelTitle: videoData.channelTitle,
                channelSubscriberCount: videoData.channelSubscriberCount,
                category: videoData.category,
                tags: videoData.tags || [],
                uploadDate: videoData.uploadDate,
                publishedAt: videoData.publishedAt,
                isLive: videoData.isLive || false,
                embedUrl: videoData.embedUrl
            },
            campaignId,
            actorId
        });

        const savedData = await crawlData.save();
        console.log(`✅ Đã lưu video: ${savedData.title}`);
        return savedData;
    } catch (error) {
        console.error('❌ Lỗi khi lưu video:', error.message);
        throw error;
    }
};

/**
 * Lưu dữ liệu tin tức
 */
const saveNewsData = async (newsData, campaignId, actorId) => {
    try {
        const crawlData = new CrawlData({
            title: newsData.title,
            description: newsData.description,
            content: newsData.content,
            type: 'news',
            url: newsData.url,
            source: newsData.source || 'Unknown',
            sourceUrl: newsData.sourceUrl || '',
            thumbnail: newsData.thumbnail,
            images: newsData.images || [],
            metadata: {
                author: newsData.author,
                publishDate: newsData.publishDate,
                category: newsData.category,
                tags: newsData.tags || [],
                readTime: newsData.readTime,
                wordCount: newsData.wordCount,
                summary: newsData.summary,
                relatedArticles: newsData.relatedArticles || []
            },
            campaignId,
            actorId
        });

        const savedData = await crawlData.save();
        console.log(`✅ Đã lưu tin tức: ${savedData.title}`);
        return savedData;
    } catch (error) {
        console.error('❌ Lỗi khi lưu tin tức:', error.message);
        throw error;
    }
};

/**
 * Lưu dữ liệu bài viết
 */
const saveArticleData = async (articleData, campaignId, actorId) => {
    try {
        const crawlData = new CrawlData({
            title: articleData.title,
            description: articleData.description,
            content: articleData.content,
            type: 'article',
            url: articleData.url,
            source: articleData.source || 'Unknown',
            sourceUrl: articleData.sourceUrl || '',
            thumbnail: articleData.thumbnail,
            images: articleData.images || [],
            metadata: {
                author: articleData.author,
                publishDate: articleData.publishDate,
                category: articleData.category,
                tags: articleData.tags || [],
                readTime: articleData.readTime,
                wordCount: articleData.wordCount,
                summary: articleData.summary
            },
            campaignId,
            actorId
        });

        const savedData = await crawlData.save();
        console.log(`✅ Đã lưu bài viết: ${savedData.title}`);
        return savedData;
    } catch (error) {
        console.error('❌ Lỗi khi lưu bài viết:', error.message);
        throw error;
    }
};

/**
 * Lưu dữ liệu tự động theo loại
 */
const saveCrawlData = async (data, campaignId, actorId, dataType = 'product') => {
    try {
        switch (dataType) {
            case 'product':
                return await saveProductData(data, campaignId, actorId);
            case 'video':
                return await saveVideoData(data, campaignId, actorId);
            case 'news':
                return await saveNewsData(data, campaignId, actorId);
            case 'article':
                return await saveArticleData(data, campaignId, actorId);
            default:
                throw new Error(`Loại dữ liệu không được hỗ trợ: ${dataType}`);
        }
    } catch (error) {
        console.error(`❌ Lỗi khi lưu dữ liệu ${dataType}:`, error.message);
        throw error;
    }
};

/**
 * Lưu nhiều dữ liệu cùng lúc
 */
const saveMultipleCrawlData = async (dataArray, campaignId, actorId, dataType = 'product') => {
    try {
        const savedData = [];

        for (const data of dataArray) {
            try {
                const saved = await saveCrawlData(data, campaignId, actorId, dataType);
                savedData.push(saved);
            } catch (error) {
                console.error(`❌ Lỗi khi lưu item:`, error.message);
                // Tiếp tục với item tiếp theo
            }
        }

        console.log(`✅ Đã lưu thành công ${savedData.length}/${dataArray.length} items`);
        return savedData;
    } catch (error) {
        console.error('❌ Lỗi khi lưu nhiều dữ liệu:', error.message);
        throw error;
    }
};

/**
 * Lấy dữ liệu theo campaign
 */
const getCrawlDataByCampaign = async (campaignId, filters = {}) => {
    try {
        const query = { campaignId, ...filters };
        const data = await CrawlData.find(query)
            .sort({ createdAt: -1 });

        return data;
    } catch (error) {
        console.error('❌ Lỗi khi lấy dữ liệu theo campaign:', error.message);
        throw error;
    }
};

/**
 * Lấy dữ liệu theo loại
 */
const getCrawlDataByType = async (type, filters = {}) => {
    try {
        const query = { type, ...filters };
        const data = await CrawlData.find(query)
            .sort({ createdAt: -1 });

        return data;
    } catch (error) {
        console.error('❌ Lỗi khi lấy dữ liệu theo loại:', error.message);
        throw error;
    }
};

/**
 * Lấy tất cả dữ liệu với pagination và filters
 */
const getAllCrawlData = async (filters = {}, pagination = {}) => {
    try {
        const { page = 1, limit = 20 } = pagination;
        const { type, status, campaignId, actorId, source } = filters;

        // Build filter
        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;
        if (campaignId) filter.campaignId = campaignId;
        if (actorId) filter.actorId = actorId;
        if (source) filter.source = source;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const data = await CrawlData.find(filter)
            .populate('campaignId', 'name')
            .populate('actorId', 'name type')
            .populate('processedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await CrawlData.countDocuments(filter);

        return {
            data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        };
    } catch (error) {
        console.error('❌ Lỗi khi lấy tất cả dữ liệu:', error.message);
        throw error;
    }
};

/**
 * Lấy dữ liệu theo ID
 */
const getCrawlDataById = async (id) => {
    try {
        const data = await CrawlData.findById(id)
            .populate('campaignId', 'name')
            .populate('actorId', 'name type')
            .populate('processedBy', 'name email');

        if (!data) {
            throw new Error('Không tìm thấy dữ liệu');
        }

        return data;
    } catch (error) {
        console.error('❌ Lỗi khi lấy dữ liệu theo ID:', error.message);
        throw error;
    }
};

/**
 * Lấy thống kê dữ liệu
 */
const getCrawlDataStats = async (filters = {}) => {
    try {
        const { campaignId, actorId } = filters;

        const matchStage = {};
        if (campaignId) matchStage.campaignId = campaignId;
        if (actorId) matchStage.actorId = actorId;

        const stats = await CrawlData.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    byType: {
                        $push: {
                            type: '$type',
                            status: '$status'
                        }
                    },
                    byStatus: {
                        $push: '$status'
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    typeStats: {
                        $reduce: {
                            input: '$byType',
                            initialValue: {},
                            in: {
                                $mergeObjects: [
                                    '$$value',
                                    {
                                        $cond: {
                                            if: { $eq: ['$$this.type', 'product'] },
                                            then: { product: { $add: [{ $ifNull: ['$$value.product', 0] }, 1] } },
                                            else: {
                                                $cond: {
                                                    if: { $eq: ['$$this.type', 'video'] },
                                                    then: { video: { $add: [{ $ifNull: ['$$value.video', 0] }, 1] } },
                                                    else: {
                                                        $cond: {
                                                            if: { $eq: ['$$this.type', 'news'] },
                                                            then: { news: { $add: [{ $ifNull: ['$$value.news', 0] }, 1] } },
                                                            else: { article: { $add: [{ $ifNull: ['$$value.article', 0] }, 1] } }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    statusStats: {
                        $reduce: {
                            input: '$byStatus',
                            initialValue: {},
                            in: {
                                $mergeObjects: [
                                    '$$value',
                                    {
                                        $cond: {
                                            if: { $eq: ['$$this', 'pending'] },
                                            then: { pending: { $add: [{ $ifNull: ['$$value.pending', 0] }, 1] } },
                                            else: {
                                                $cond: {
                                                    if: { $eq: ['$$this', 'approved'] },
                                                    then: { approved: { $add: [{ $ifNull: ['$$value.approved', 0] }, 1] } },
                                                    else: {
                                                        $cond: {
                                                            if: { $eq: ['$$this', 'rejected'] },
                                                            then: { rejected: { $add: [{ $ifNull: ['$$value.rejected', 0] }, 1] } },
                                                            else: { translated: { $add: [{ $ifNull: ['$$value.translated', 0] }, 1] } }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        ]);

        return stats[0] || { total: 0, typeStats: {}, statusStats: {} };
    } catch (error) {
        console.error('❌ Lỗi khi lấy thống kê:', error.message);
        throw error;
    }
};

/**
 * Cập nhật trạng thái dữ liệu
 */
const updateCrawlDataStatus = async (dataId, status, processedBy = null) => {
    try {
        const updateData = { status };
        if (processedBy) {
            updateData.processedBy = processedBy;
            updateData.processedAt = new Date();
        }

        const updatedData = await CrawlData.findByIdAndUpdate(
            dataId,
            updateData,
            { new: true }
        );

        console.log(`✅ Đã cập nhật trạng thái: ${updatedData.title} -> ${status}`);
        return updatedData;
    } catch (error) {
        console.error('❌ Lỗi khi cập nhật trạng thái:', error.message);
        throw error;
    }
};

/**
 * Xóa dữ liệu theo campaign
 */
const deleteCrawlDataByCampaign = async (campaignId) => {
    try {
        const result = await CrawlData.deleteMany({ campaignId });
        console.log(`✅ Đã xóa ${result.deletedCount} records cho campaign ${campaignId}`);
        return result;
    } catch (error) {
        console.error('❌ Lỗi khi xóa dữ liệu:', error.message);
        throw error;
    }
};

module.exports = {
    saveProductData,
    saveVideoData,
    saveNewsData,
    saveArticleData,
    saveCrawlData,
    saveMultipleCrawlData,
    getCrawlDataByCampaign,
    getCrawlDataByType,
    getAllCrawlData,
    getCrawlDataById,
    updateCrawlDataStatus,
    deleteCrawlDataByCampaign,
    getCrawlDataStats
};

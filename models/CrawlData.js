const mongoose = require('mongoose');

const crawlDataSchema = new mongoose.Schema({
  // 1. Thông tin cơ bản chung
  title: {
    type: String,
    required: [true, 'Tiêu đề là bắt buộc'],
    trim: true,
    maxlength: [500, 'Tiêu đề không được quá 500 ký tự']
  },
  description: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },

  // 2. Loại dữ liệu
  type: {
    type: String,
    enum: ['product', 'video', 'news', 'article'],
    required: [true, 'Loại dữ liệu là bắt buộc']
  },

  // 3. URL và nguồn
  url: {
    type: String,
    required: [true, 'URL là bắt buộc'],
    trim: true
  },
  source: {
    type: String,
    trim: true // "DAISANB2B", "YouTube", "VnExpress", etc.
  },
  sourceUrl: {
    type: String,
    trim: true
  },

  // 4. Thông tin chung cho tất cả loại
  thumbnail: {
    type: String,
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],

  // 5. Dữ liệu đặc thù theo loại (lưu trong metadata)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // 6. Thông tin liên kết với hệ thống
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: [true, 'Campaign ID là bắt buộc']
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Actor',
    required: [true, 'Actor ID là bắt buộc']
  },

  // 7. Trạng thái xử lý
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'translated'],
    default: 'pending'
  },

  // 8. Thông tin người xử lý
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },

  // 9. Ghi chú
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Ghi chú không được quá 1000 ký tự']
  }
}, {
  timestamps: true
});

// Indexes
crawlDataSchema.index({ type: 1, createdAt: -1 });
crawlDataSchema.index({ campaignId: 1, type: 1 });
crawlDataSchema.index({ actorId: 1, type: 1 });
crawlDataSchema.index({ status: 1, type: 1 });
crawlDataSchema.index({ source: 1, type: 1 });
crawlDataSchema.index({ url: 1 });
crawlDataSchema.index({ title: 'text', description: 'text' });
crawlDataSchema.index({ createdAt: -1 });

// Index cho metadata theo loại
crawlDataSchema.index({ "metadata.sku": 1 }, { sparse: true }); // Cho sản phẩm
crawlDataSchema.index({ "metadata.videoId": 1 }, { sparse: true }); // Cho video
crawlDataSchema.index({ "metadata.author": 1 }, { sparse: true }); // Cho tin tức

module.exports = mongoose.model('CrawlData', crawlDataSchema); 
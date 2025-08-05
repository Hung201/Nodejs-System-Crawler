const mongoose = require('mongoose');

const crawlDataSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tiêu đề không được quá 200 ký tự']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Mô tả không được quá 1000 ký tự']
  },
  content: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['product', 'news', 'video'],
    required: [true, 'Loại dữ liệu là bắt buộc']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'translated'],
    default: 'pending'
  },
  sourceName: {
    type: String,
    required: [true, 'Tên nguồn là bắt buộc']
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Source',
    required: true
  },
  rawUrl: {
    type: String,
    required: [true, 'URL gốc là bắt buộc']
  },
  image: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Ghi chú không được quá 500 ký tự']
  }
}, {
  timestamps: true
});

// Indexes
crawlDataSchema.index({ status: 1, type: 1 });
crawlDataSchema.index({ sourceId: 1 });
crawlDataSchema.index({ createdAt: -1 });
crawlDataSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('CrawlData', crawlDataSchema); 
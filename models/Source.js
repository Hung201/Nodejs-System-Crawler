const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên nguồn là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên nguồn không được quá 100 ký tự']
  },
  dataType: {
    type: String,
    enum: ['product', 'news', 'video'],
    required: [true, 'Loại dữ liệu là bắt buộc']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  actorId: {
    type: String,
    required: [true, 'Actor ID là bắt buộc']
  },
  schedule: {
    type: String,
    enum: ['manual', 'hourly', 'daily', 'weekly', 'monthly'],
    default: 'manual'
  },
  startUrls: [{
    type: String,
    required: [true, 'URL bắt đầu là bắt buộc'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL không hợp lệ'
    }
  }],
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastRun: {
    type: Date,
    default: null
  },
  nextRun: {
    type: Date,
    default: null
  },
  totalRuns: {
    type: Number,
    default: 0
  },
  successRuns: {
    type: Number,
    default: 0
  },
  failedRuns: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
sourceSchema.index({ status: 1, dataType: 1 });
sourceSchema.index({ createdBy: 1 });
sourceSchema.index({ nextRun: 1 });

module.exports = mongoose.model('Source', sourceSchema); 
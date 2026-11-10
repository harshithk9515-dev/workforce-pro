const mongoose = require('mongoose');
const { REPORT_TYPE, REPORT_FORMAT } = require('../config/constants');

const reportSchema = new mongoose.Schema(
  {
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(REPORT_TYPE),
      required: true,
    },
    format: {
      type: String,
      enum: Object.values(REPORT_FORMAT),
      required: true,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    recordCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

reportSchema.index({ generatedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);

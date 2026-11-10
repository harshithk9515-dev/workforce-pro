const mongoose = require('mongoose');
const { PROJECT_STATUS, PRIORITY } = require('../config/constants');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [120, 'Project name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A project must have a manager'],
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.PLANNING,
    },
    priority: {
      type: String,
      enum: Object.values(PRIORITY),
      default: PRIORITY.MEDIUM,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function validateEndDate(value) {
          return !this.startDate || value >= this.startDate;
        },
        message: 'End date must be on or after the start date',
      },
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

projectSchema.index({ status: 1 });
projectSchema.index({ manager: 1 });
projectSchema.index({ teamMembers: 1 });

module.exports = mongoose.model('Project', projectSchema);

const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfJoining: {
      type: Date,
      default: Date.now,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    skills: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on-leave'],
      default: 'active',
    },
  },
  { timestamps: true }
);

employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });

// Generates the next sequential employee code, e.g. EMP0007
employeeSchema.statics.generateEmployeeId = async function generateEmployeeId() {
  const count = await this.countDocuments();
  return `EMP${String(count + 1).padStart(4, '0')}`;
};

module.exports = mongoose.model('Employee', employeeSchema);

const mongoose = require('mongoose');

const ACTIVITY_TYPES = ['created', 'status_changed', 'updated', 'comment'];

const activitySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true,
    },
    // System-generated description for non-comment events, e.g. "changed status to In Progress"
    message: {
      type: String,
      trim: true,
      default: '',
    },
    // The actual comment body. Only used when type === 'comment'.
    text: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

activitySchema.index({ task: 1, createdAt: 1 });
activitySchema.statics.TYPES = ACTIVITY_TYPES;

module.exports = mongoose.model('Activity', activitySchema);

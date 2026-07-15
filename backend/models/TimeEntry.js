const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema(
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
    startTime: {
      type: Date,
      required: true,
    },
    // null while the timer is still running
    endTime: {
      type: Date,
      default: null,
    },
    // Set once the timer is stopped. Kept as a stored value (rather than
    // computed on every read) so historical totals stay stable and cheap to
    // aggregate.
    durationSeconds: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Fast lookup of "does this user have a timer running right now".
timeEntrySchema.index({ user: 1, endTime: 1 });
timeEntrySchema.index({ task: 1 });

module.exports = mongoose.model('TimeEntry', timeEntrySchema);

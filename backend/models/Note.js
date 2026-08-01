const mongoose = require('mongoose');

const NOTE_COLORS = ['default', 'cyan', 'amber', 'green', 'red', 'violet'];

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
    },
    content: {
      type: String,
      default: '',
      trim: true,
    },
    color: {
      type: String,
      enum: NOTE_COLORS,
      default: 'default',
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    // Notes are private to the user who created them — every query in the
    // route layer scopes by owner so no one can read/edit/delete another
    // user's notes, regardless of role (admin included).
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

noteSchema.index({ owner: 1, pinned: -1, updatedAt: -1 });
noteSchema.statics.COLOR_VALUES = NOTE_COLORS;

module.exports = mongoose.model('Note', noteSchema);

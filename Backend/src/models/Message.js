const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

MessageSchema.index({ booking: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);

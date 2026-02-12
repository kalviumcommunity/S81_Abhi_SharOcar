const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String }
  },
  { timestamps: true }
);

ReviewSchema.index({ ride: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);

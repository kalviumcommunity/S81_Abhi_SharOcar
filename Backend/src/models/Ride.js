const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    date: { type: Date, required: true },
    seats: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    parcelAllowed: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', RideSchema);

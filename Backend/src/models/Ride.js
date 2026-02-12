const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rideType: { type: String, enum: ['seat', 'parcel'], default: 'seat', required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    date: { type: Date, required: true },
    carModel: { type: String },
    pickupTime: { type: String },
    dropTime: { type: String },
    seats: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    parcelWeightKg: { type: Number, min: 0 },
    parcelAllowed: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', RideSchema);

const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['seat', 'parcel'], required: true },
    seatsCount: { type: Number, min: 1 },
    parcelDetails: { type: String },
    paymentMethod: { type: String, enum: ['UPI', 'Card', 'Cash'], required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'confirmed' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);

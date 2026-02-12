const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['seat', 'parcel'], required: true },
    seatsCount: { type: Number, min: 1 },
    passengers: [
      {
        name: { type: String },
        phone: { type: String },
        age: { type: Number, min: 0 },
        luggageCount: { type: Number, min: 0 }
      }
    ],
    parcelDetails: { type: String },
    paymentMethod: { type: String, enum: ['UPI', 'Card', 'Cash', 'BillDesk', 'Razorpay'], required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    status: { type: String, enum: ['pending', 'confirmed', 'rejected', 'cancelled'], default: 'pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);

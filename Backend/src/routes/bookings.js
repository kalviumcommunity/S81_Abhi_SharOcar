const express = require('express');
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const auth = require('../middleware/auth');

const router = express.Router();

// Create booking (passenger)
router.post('/', auth('passenger'), async (req, res, next) => {
  try {
    const { rideId, type, seatsCount, parcelDetails, paymentMethod } = req.body;
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    if (type === 'seat') {
      if (!seatsCount || seatsCount < 1) return res.status(400).json({ message: 'Invalid seatsCount' });
      if (ride.seats < seatsCount) return res.status(400).json({ message: 'Not enough seats' });
      ride.seats -= seatsCount;
      await ride.save();
    }

    if (type === 'parcel' && !ride.parcelAllowed) return res.status(400).json({ message: 'Parcel not allowed on this ride' });

    const booking = await Booking.create({
      ride: ride._id,
      user: req.user._id,
      type,
      seatsCount: type === 'seat' ? seatsCount : undefined,
      parcelDetails: type === 'parcel' ? parcelDetails : undefined,
      paymentMethod
    });
    res.status(201).json(booking);
  } catch (e) {
    next(e);
  }
});

// My bookings (passenger)
router.get('/me', auth(), async (req, res, next) => {
  try {
    const q = req.user.role === 'passenger' ? { user: req.user._id } : {};
    if (req.user.role === 'driver') {
      // driver's bookings across their rides
      const rides = await Ride.find({ driver: req.user._id }).select('_id');
      q.ride = { $in: rides.map((r) => r._id) };
    }
    const bookings = await Booking.find(q)
      .sort({ createdAt: -1 })
      .populate('ride')
      .populate('user', 'name role');
    res.json(bookings);
  } catch (e) {
    next(e);
  }
});

module.exports = router;

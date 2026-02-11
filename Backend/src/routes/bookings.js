const express = require('express');
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const auth = require('../middleware/auth');

const router = express.Router();

// Create booking (passenger)
router.post('/', auth('passenger'), async (req, res, next) => {
  try {
    const { rideId, type, seatsCount, passengers, parcelDetails, paymentMethod } = req.body;
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    if (type === 'seat') {
      if (!seatsCount || seatsCount < 1) return res.status(400).json({ message: 'Invalid seatsCount' });
      if (!Array.isArray(passengers) || passengers.length !== seatsCount) {
        return res.status(400).json({ message: 'Passengers must be provided for each seat' });
      }
      for (const p of passengers) {
        if (!p?.name || !p?.phone || p?.age === undefined || p?.age === null) {
          return res.status(400).json({ message: 'Each passenger must include name, phone, and age' });
        }
      }
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
      passengers: type === 'seat' ? passengers : undefined,
      parcelDetails: type === 'parcel' ? parcelDetails : undefined,
      paymentMethod,
      status: 'pending'
    });
    res.status(201).json(booking);
  } catch (e) {
    next(e);
  }
});

// Approve booking (driver)
router.patch('/:id/approve', auth('driver'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('ride');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!booking.ride) return res.status(404).json({ message: 'Ride not found' });
    if (String(booking.ride.driver) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be approved' });
    }

    booking.status = 'confirmed';
    await booking.save();
    res.json(booking);
  } catch (e) {
    next(e);
  }
});

// Reject booking (driver)
router.patch('/:id/reject', auth('driver'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('ride');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!booking.ride) return res.status(404).json({ message: 'Ride not found' });
    if (String(booking.ride.driver) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be rejected' });
    }

    // Restore seats if we reserved them at booking time
    if (booking.type === 'seat' && booking.seatsCount) {
      const ride = await Ride.findById(booking.ride._id);
      if (ride) {
        ride.seats += booking.seatsCount;
        await ride.save();
      }
    }

    booking.status = 'rejected';
    await booking.save();
    res.json(booking);
  } catch (e) {
    next(e);
  }
});

// Cancel booking (passenger)
router.patch('/:id/cancel', auth('passenger'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Only pending/confirmed bookings can be cancelled' });
    }

    // Restore seats if we reserved them at booking time
    if (booking.type === 'seat' && booking.seatsCount) {
      const ride = await Ride.findById(booking.ride);
      if (ride) {
        ride.seats += booking.seatsCount;
        await ride.save();
      }
    }

    booking.status = 'cancelled';
    await booking.save();
    res.json(booking);
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

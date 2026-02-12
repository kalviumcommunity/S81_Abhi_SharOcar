const express = require('express');
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

const router = express.Router();

// Create booking (passenger)
router.post('/', auth('passenger'), async (req, res, next) => {
  try {
    const { rideId, type, seatsCount, passengers, parcelDetails, paymentMethod } = req.body;
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const requestedType = type || 'seat';
    if (!['seat', 'parcel'].includes(requestedType)) {
      return res.status(400).json({ message: 'Invalid booking type' });
    }

    const effectiveRideType = ride.rideType || 'seat';

    if (effectiveRideType === 'seat' && requestedType !== 'seat') {
      return res.status(400).json({ message: 'This post is passengers-only' });
    }
    if (effectiveRideType === 'parcel' && requestedType !== 'parcel') {
      return res.status(400).json({ message: 'This post is parcel-only' });
    }

    if (requestedType === 'seat') {
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

    if (requestedType === 'parcel' && !ride.parcelAllowed) return res.status(400).json({ message: 'Parcel not allowed on this ride' });

    const booking = await Booking.create({
      ride: ride._id,
      user: req.user._id,
      type: requestedType,
      seatsCount: requestedType === 'seat' ? seatsCount : undefined,
      passengers: requestedType === 'seat' ? passengers : undefined,
      parcelDetails: requestedType === 'parcel' ? parcelDetails : undefined,
      paymentMethod,
      status: 'pending'
    });

    // Create a notification for the driver (best-effort)
    try {
      await Notification.create({
        user: ride.driver,
        type: 'booking',
        title: 'New booking',
        message: `${req.user.name} booked your post (${ride.from} → ${ride.to})`,
        booking: booking._id,
        ride: ride._id
      });
    } catch (e) {
      // ignore
    }

    // Seed a chat thread (optional but helps UX)
    try {
      await Message.create({
        booking: booking._id,
        sender: req.user._id,
        text: requestedType === 'parcel' ? 'Parcel booking created.' : 'Seat booking created.'
      });
    } catch (e) {
      // ignore
    }

    res.status(201).json(booking);
  } catch (e) {
    next(e);
  }
});

// Get messages for a booking (only passenger or ride driver)
router.get('/:id/messages', auth(), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: 'Booking not found' });

    const booking = await Booking.findById(id).populate({
      path: 'ride',
      select: 'driver from to',
      populate: { path: 'driver', select: 'name role' }
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!booking.ride) return res.status(404).json({ message: 'Ride not found' });

    const userId = String(req.user._id);
    const isPassenger = String(booking.user) === userId;
    const isDriver = String(booking.ride.driver?._id || booking.ride.driver) === userId;
    if (!isPassenger && !isDriver) return res.status(403).json({ message: 'Forbidden' });

    const messages = await Message.find({ booking: booking._id })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role');

    res.json({ booking, messages });
  } catch (e) {
    next(e);
  }
});

// Send message for a booking (only passenger or ride driver)
router.post('/:id/messages', auth(), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: 'Booking not found' });

    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Message text is required' });
    if (text.length > 1000) return res.status(400).json({ message: 'Message too long' });

    const booking = await Booking.findById(id).populate({
      path: 'ride',
      select: 'driver',
      populate: { path: 'driver', select: 'name role' }
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!booking.ride) return res.status(404).json({ message: 'Ride not found' });

    const userId = String(req.user._id);
    const isPassenger = String(booking.user) === userId;
    const isDriver = String(booking.ride.driver?._id || booking.ride.driver) === userId;
    if (!isPassenger && !isDriver) return res.status(403).json({ message: 'Forbidden' });

    const msg = await Message.create({ booking: booking._id, sender: req.user._id, text });
    const populated = await msg.populate('sender', 'name role');
    res.status(201).json(populated);
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

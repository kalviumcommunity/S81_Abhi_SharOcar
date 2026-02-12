const express = require('express');
const mongoose = require('mongoose');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const auth = require('../middleware/auth');

const router = express.Router();

// Create ride (driver only)
router.post('/', auth('driver'), async (req, res, next) => {
  try {
    const { from, to, date, seats, price, carModel, pickupTime, dropTime, rideType, parcelWeightKg } = req.body;

    const effectiveRideType = rideType || 'seat';
    if (!['seat', 'parcel'].includes(effectiveRideType)) {
      return res.status(400).json({ message: 'Invalid rideType' });
    }

    const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (pickupTime && !timeRe.test(String(pickupTime))) {
      return res.status(400).json({ message: 'Invalid pickupTime (HH:mm)' });
    }
    if (dropTime && !timeRe.test(String(dropTime))) {
      return res.status(400).json({ message: 'Invalid dropTime (HH:mm)' });
    }

    if (effectiveRideType === 'seat') {
      const n = Number(seats);
      if (!Number.isFinite(n) || n < 1) {
        return res.status(400).json({ message: 'Invalid seats' });
      }
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: 'Invalid price' });
    }

    let numericParcelWeightKg;
    if (parcelWeightKg !== undefined && parcelWeightKg !== null && String(parcelWeightKg) !== '') {
      numericParcelWeightKg = Number(parcelWeightKg);
      if (!Number.isFinite(numericParcelWeightKg) || numericParcelWeightKg < 0) {
        return res.status(400).json({ message: 'Invalid parcelWeightKg' });
      }
    }

    const ride = await Ride.create({
      driver: req.user._id,
      rideType: effectiveRideType,
      from,
      to,
      date,
      carModel,
      pickupTime,
      dropTime,
      seats: effectiveRideType === 'parcel' ? 0 : Number(seats),
      price: numericPrice,
      parcelWeightKg: effectiveRideType === 'parcel' ? numericParcelWeightKg : undefined,
      parcelAllowed: effectiveRideType === 'parcel'
    });
    res.status(201).json(ride);
  } catch (e) {
    next(e);
  }
});

// List/search rides
router.get('/', async (req, res, next) => {
  try {
    const { from, to, date } = req.query;
    const q = {};
    if (from) q.from = new RegExp(from, 'i');
    if (to) q.to = new RegExp(to, 'i');
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      q.date = { $gte: d, $lt: next };
    }
    const rides = await Ride.find(q).sort({ date: 1 }).populate('driver', 'name role');
    res.json(rides);
  } catch (e) {
    next(e);
  }
});

// Driver's rides
router.get('/mine', auth('driver'), async (req, res, next) => {
  try {
    const rides = await Ride.find({ driver: req.user._id }).sort({ createdAt: -1 });
    res.json(rides);
  } catch (e) {
    next(e);
  }
});

// Ride reviews (public list)
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    const reviews = await Review.find({ ride: id })
      .sort({ createdAt: -1 })
      .populate('user', 'name avatarPath role');
    res.json(reviews);
  } catch (e) {
    next(e);
  }
});

// Create/update review (passenger only; must have booked the ride)
router.post('/:id/reviews', auth('passenger'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const rating = Number(req.body?.rating);
    const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const booking = await Booking.findOne({ ride: id, user: req.user._id });
    if (!booking) return res.status(403).json({ message: 'You can review only rides you booked' });

    const review = await Review.findOneAndUpdate(
      { ride: id, user: req.user._id },
      { $set: { rating, comment } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('user', 'name avatarPath role');

    res.status(201).json(review);
  } catch (e) {
    // handle duplicate key race gracefully
    if (e?.code === 11000) {
      return res.status(409).json({ message: 'Review already exists' });
    }
    next(e);
  }
});

// Update ride (driver only, owner only)
router.patch('/:id', auth('driver'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const patch = {};
    const allowed = ['from', 'to', 'date', 'seats', 'price', 'carModel', 'pickupTime', 'dropTime', 'rideType', 'parcelWeightKg'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    }

    if (patch.rideType !== undefined && !['seat', 'parcel'].includes(patch.rideType)) {
      return res.status(400).json({ message: 'Invalid rideType' });
    }

    const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (patch.pickupTime !== undefined && patch.pickupTime !== null && patch.pickupTime !== '' && !timeRe.test(String(patch.pickupTime))) {
      return res.status(400).json({ message: 'Invalid pickupTime (HH:mm)' });
    }
    if (patch.dropTime !== undefined && patch.dropTime !== null && patch.dropTime !== '' && !timeRe.test(String(patch.dropTime))) {
      return res.status(400).json({ message: 'Invalid dropTime (HH:mm)' });
    }

    if (patch.date !== undefined) {
      const d = new Date(patch.date);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ message: 'Invalid date' });
      }
      patch.date = d;
    }

    if (patch.seats !== undefined) {
      const n = Number(patch.seats);
      if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ message: 'Invalid seats' });
      }
      patch.seats = n;
    }

    if (patch.price !== undefined) {
      const n = Number(patch.price);
      if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ message: 'Invalid price' });
      }
      patch.price = n;
    }

    if (patch.parcelWeightKg !== undefined) {
      if (patch.parcelWeightKg === null || String(patch.parcelWeightKg) === '') {
        patch.parcelWeightKg = undefined;
      } else {
        const n = Number(patch.parcelWeightKg);
        if (!Number.isFinite(n) || n < 0) {
          return res.status(400).json({ message: 'Invalid parcelWeightKg' });
        }
        patch.parcelWeightKg = n;
      }
    }

    const ride = await Ride.findOneAndUpdate(
      { _id: id, driver: req.user._id },
      { $set: patch },
      { new: true, runValidators: true }
    );

    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    // Enforce strict separation after update
    if (ride.rideType === 'parcel') {
      if (ride.seats !== 0) {
        ride.seats = 0;
      }
      if (ride.parcelAllowed !== true) {
        ride.parcelAllowed = true;
      }
      await ride.save();
    }
    if (ride.rideType === 'seat') {
      if (ride.parcelAllowed !== false) {
        ride.parcelAllowed = false;
        ride.parcelWeightKg = undefined;
        await ride.save();
      }
    }
    res.json(ride);
  } catch (e) {
    next(e);
  }
});

// Delete ride (driver only, owner only)
router.delete('/:id', auth('driver'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const ride = await Ride.findOne({ _id: id, driver: req.user._id });
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    // Remove related bookings to avoid orphaned documents
    await Booking.deleteMany({ ride: ride._id });
    await ride.deleteOne();

    res.json({ message: 'Ride deleted' });
  } catch (e) {
    next(e);
  }
});

// Ride details
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    const ride = await Ride.findById(req.params.id).populate('driver', 'name role');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.json(ride);
  } catch (e) {
    next(e);
  }
});

module.exports = router;

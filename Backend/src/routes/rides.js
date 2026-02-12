const express = require('express');
const mongoose = require('mongoose');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

const router = express.Router();

// Create ride (driver only)
router.post('/', auth('driver'), async (req, res, next) => {
  try {
    const { from, to, date, seats, price, parcelAllowed = true } = req.body;
    const ride = await Ride.create({
      driver: req.user._id,
      from,
      to,
      date,
      seats,
      price,
      parcelAllowed
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

// Update ride (driver only, owner only)
router.patch('/:id', auth('driver'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const patch = {};
    const allowed = ['from', 'to', 'date', 'seats', 'price', 'parcelAllowed'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
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

    const ride = await Ride.findOneAndUpdate(
      { _id: id, driver: req.user._id },
      { $set: patch },
      { new: true, runValidators: true }
    );

    if (!ride) return res.status(404).json({ message: 'Ride not found' });
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

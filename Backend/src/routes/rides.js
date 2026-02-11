const express = require('express');
const Ride = require('../models/Ride');
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

module.exports = router;

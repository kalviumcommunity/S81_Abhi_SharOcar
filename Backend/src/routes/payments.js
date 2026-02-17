  const express = require('express');
  const Razorpay = require('razorpay');

  const auth = require('../middleware/auth');
  const Ride = require('../models/Ride');

  const router = express.Router();

  function makeReceipt({ rideId, userId }) {
    const ts = Date.now().toString(36); // shorter than ms integer
    const rideTail = String(rideId || '').slice(-6);
    const userTail = String(userId || '').slice(-6);
    return `bk_${ts}_${userTail}${rideTail}`.slice(0, 40);
  }

  function getRazorpayClient() {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      const err = new Error('Razorpay keys not configured');
      err.status = 500;
      throw err;
    }
    return new Razorpay({ key_id, key_secret });
  }

  // Create Razorpay order for a ride booking
  router.post('/razorpay/order', auth('passenger'), async (req, res, next) => {
    try {
      const { rideId, type, seatsCount } = req.body || {};
      const requestedType = type || 'seat';

      if (!rideId) return res.status(400).json({ message: 'rideId is required' });
      if (!['seat', 'parcel'].includes(requestedType)) {
        return res.status(400).json({ message: 'Invalid booking type' });
      }

      const ride = await Ride.findById(rideId);
      if (!ride) return res.status(404).json({ message: 'Ride not found' });

      const effectiveRideType = ride.rideType || 'seat';
      if (effectiveRideType === 'seat' && requestedType !== 'seat') {
        return res.status(400).json({ message: 'This post is passengers-only' });
      }
      if (effectiveRideType === 'parcel' && requestedType !== 'parcel') {
        return res.status(400).json({ message: 'This post is parcel-only' });
      }

      let amountRupees = 0;
      if (requestedType === 'seat') {
        const n = Number(seatsCount);
        if (!Number.isFinite(n) || n < 1) return res.status(400).json({ message: 'Invalid seatsCount' });
        amountRupees = Number(ride.price || 0) * n;
      } else {
        amountRupees = Number(ride.price || 0);
      }

      const amountPaise = Math.round(amountRupees * 100);
      if (!Number.isFinite(amountPaise) || amountPaise < 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }

      const client = getRazorpayClient();

      const receipt = makeReceipt({ rideId, userId: req.user._id });
      const order = await client.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes: {
          rideId: String(rideId),
          userId: String(req.user._id),
          type: requestedType,
        },
      });

      res.json({
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      });
    } catch (e) {
      next(e);
    }
  });

  module.exports = router;

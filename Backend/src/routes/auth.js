const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const upload = require('../middleware/upload');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Signup (supports driver document uploads)
router.post(
  '/signup',
  upload.fields([
    { name: 'aadhaar', maxCount: 1 },
    { name: 'license', maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      if (!['passenger', 'driver'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: 'Email already registered' });

      const hashed = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        email,
        password: hashed,
        role
      });

      if (role === 'driver') {
        user.documents = {
          aadhaarPath: req.files?.aadhaar?.[0]?.path || null,
          licensePath: req.files?.license?.[0]?.path || null,
          status: 'pending'
        };
      }

      await user.save();
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'devsecret', {
        expiresIn: '7d'
      });
      const safe = user.toObject();
      delete safe.password;
      res.status(201).json({ token, user: safe });
    } catch (e) {
      next(e);
    }
  }
);

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'devsecret', {
      expiresIn: '7d'
    });
    const safe = user.toObject();
    delete safe.password;
    res.json({ token, user: safe });
  } catch (e) {
    next(e);
  }
});

// Me
router.get('/me', auth(), async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

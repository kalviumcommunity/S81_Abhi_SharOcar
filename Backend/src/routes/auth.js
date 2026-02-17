const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const upload = require('../middleware/upload');
const User = require('../models/User');
const auth = require('../middleware/auth');
const path = require('path');
const { getFirebaseAuth } = require('../lib/firebaseAdmin');

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

      const normalizeUploadPath = (filePath) => {
        const fileName = path.basename(filePath || '').replace(/\\/g, '/');
        if (!fileName) return null;
        return `/uploads/${fileName}`;
      };

      if (role === 'driver') {
        user.documents = {
          aadhaarPath: normalizeUploadPath(req.files?.aadhaar?.[0]?.path) || null,
          licensePath: normalizeUploadPath(req.files?.license?.[0]?.path) || null,
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
    if (!user.password) {
      return res.status(401).json({ message: 'This account uses Google sign-in. Please continue with Google.' });
    }
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

// Google (Firebase ID token -> API JWT)
router.post('/google', async (req, res, next) => {
  try {
    const { idToken, role } = req.body || {};
    if (!idToken) return res.status(400).json({ message: 'Missing idToken' });

    const decoded = await getFirebaseAuth().verifyIdToken(String(idToken));
    const email = decoded.email ? String(decoded.email).toLowerCase() : '';
    if (!email) return res.status(400).json({ message: 'Google account has no email' });

    let user = await User.findOne({ email });
    const displayName = decoded.name ? String(decoded.name) : undefined;
    const avatarUrl = decoded.picture ? String(decoded.picture) : undefined;

    if (!user) {
      if (!role) {
        return res.status(400).json({ message: 'No account found. Please sign up and choose a role.' });
      }
      if (!['passenger', 'driver'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      user = new User({
        name: displayName || email.split('@')[0],
        email,
        role,
        authProvider: 'google',
        googleUid: decoded.uid,
        avatarUrl,
      });

      if (role === 'driver') {
        user.documents = {
          aadhaarPath: null,
          licensePath: null,
          status: 'pending',
        };
      }

      await user.save();
    } else {
      const updates = {};
      if (!user.googleUid) updates.googleUid = decoded.uid;
      if (!user.password && user.authProvider !== 'google') updates.authProvider = 'google';
      if (displayName && (!user.name || user.name === user.email)) updates.name = displayName;
      if (avatarUrl && !user.avatarUrl) updates.avatarUrl = avatarUrl;
      if (Object.keys(updates).length) {
        user = await User.findByIdAndUpdate(user._id, updates, { new: true });
      }
    }

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

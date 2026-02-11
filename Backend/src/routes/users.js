const express = require('express');
const fs = require('fs');
const path = require('path');

const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

function uploadDir() {
  return process.env.UPLOAD_DIR || 'uploads';
}

function safeUser(userDoc) {
  // auth() already excludes password, but keep this defensive.
  const obj = userDoc?.toObject ? userDoc.toObject() : userDoc;
  if (obj && typeof obj === 'object') delete obj.password;
  return obj;
}

function normalizeAvatarPath(filePath) {
  const fileName = path.basename(filePath || '').replace(/\\/g, '/');
  if (!fileName) return null;
  return `/uploads/${fileName}`;
}

function deleteExistingAvatarIfAny(user) {
  try {
    const current = user?.avatarPath;
    if (!current) return;
    const baseName = path.basename(current);
    if (!baseName) return;

    const full = path.join(process.cwd(), uploadDir(), baseName);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch (e) {
    // ignore file delete errors
  }
}

// Update current user's profile (name/phone). Email comes from login and is not editable here.
router.patch('/me', auth(), async (req, res, next) => {
  try {
    const { name, phone } = req.body || {};

    if (typeof name === 'string') req.user.name = name.trim();
    if (typeof phone === 'string') req.user.phone = phone.trim();

    await req.user.save();
    res.json({ user: safeUser(req.user) });
  } catch (e) {
    next(e);
  }
});

// Upload / replace avatar
router.post('/me/avatar', auth(), upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file?.path) return res.status(400).json({ message: 'No avatar file provided' });

    deleteExistingAvatarIfAny(req.user);

    req.user.avatarPath = normalizeAvatarPath(req.file.path);
    await req.user.save();

    res.json({ user: safeUser(req.user) });
  } catch (e) {
    next(e);
  }
});

// Remove avatar
router.delete('/me/avatar', auth(), async (req, res, next) => {
  try {
    deleteExistingAvatarIfAny(req.user);

    req.user.avatarPath = null;
    await req.user.save();

    res.json({ user: safeUser(req.user) });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

const jwt = require('jsonwebtoken');
const User = require('../models/User');

function auth(requiredRole = null) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) return res.status(401).json({ message: 'No token provided' });
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
      const user = await User.findById(payload.id).select('-password');
      if (!user) return res.status(401).json({ message: 'Invalid token user' });
      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.user = user;
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = auth;

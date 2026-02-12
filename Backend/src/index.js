const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./lib/db');

dotenv.config();

const app = express();

// Core middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const clientUrlEnv = process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = clientUrlEnv
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (/^http:\/\/localhost:\d{4}$/.test(origin)) return cb(null, true);
      if (/^https:\/\/.*\.netlify\.app$/.test(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(morgan('dev'));

// Static uploads
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(process.cwd(), UPLOAD_DIR)));

// Routes
app.get('/', (req, res) => res.json({ status: 'ok', service: 'ridecarry-api' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payments', require('./routes/payments'));

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process or change PORT in .env.`);
        process.exit(1);
      }
      console.error('Server error:', err);
      process.exit(1);
    });
  })
  .catch((e) => {
    console.error('DB connection failed:', e);
    process.exit(1);
  });

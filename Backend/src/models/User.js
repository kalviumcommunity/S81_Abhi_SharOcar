const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    aadhaarPath: String,
    licensePath: String,
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['passenger', 'driver'], required: true },
    documents: DocumentSchema
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);

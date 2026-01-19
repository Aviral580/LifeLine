const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Identity fields only
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    // Not required if using Google OAuth
    required: function() { return !this.googleId; }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values for non-Google users
  },
  
  // Account management metadata 
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
  // STRICTLY NO PREFERENCES OR HISTORY HERE
});

module.exports = mongoose.model('User', UserSchema);
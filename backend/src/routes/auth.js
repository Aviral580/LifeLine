const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @route   POST /auth/register
// @desc    Register a new user (Email/Password)
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    // Secure hashing 
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user = new User({ email, passwordHash });
    await user.save();

    // Auto-login after register
    req.login(user, (err) => {
      if (err) throw err;
      res.json({ msg: 'Registration successful', user: { id: user.id, email: user.email } });
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /auth/login
// @desc    Login user
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ msg: info.message });
    
    req.login(user, (err) => {
      if (err) return next(err);
      return res.json({ msg: 'Login successful', user: { id: user.id, email: user.email } });
    });
  })(req, res, next);
});

// @route   GET /auth/google
// @desc    Trigger Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /auth/google/callback
// @desc    Google auth callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('http://localhost:5000/dashboard'); // Redirect to frontend
  }
);

// @route   GET /auth/logout
// @desc    Logout and destroy session 
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    // Explicitly destroy session to ensure no trace is left
    req.session.destroy((err) => {
      if (err) console.log('Session destruction error', err);
      res.clearCookie('connect.sid'); // Clear the cookie
      res.json({ msg: 'Logged out successfully' });
    });
  });
});

module.exports = router;


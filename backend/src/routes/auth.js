const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    user = new User({ email, passwordHash });
    await user.save();
    req.login(user, (err) => {
      if (err) throw err;
      res.json({ msg: 'Registration successful', user: { id: user.id, email: user.email } });
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});
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
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('http://localhost:5000/dashboard'); 
  }
);
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) console.log('Session destruction error', err);
      res.clearCookie('connect.sid'); 
      res.json({ msg: 'Logged out successfully' });
    });
  });
});
module.exports = router;
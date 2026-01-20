require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const passport = require('passport');
const app = express();
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/config/db.js';
import searchRoutes from './src/routes/searchRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js'; 

dotenv.config();
connectDB();

app.use(express.json());
app.use(cors());
app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});



function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}


app.use(session({
  name: 'lifeline.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,

  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60, // 1 day
    autoRemove: 'native'
  }),

  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // MUST be boolean
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes); 

app.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', { user: req.user });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/login');
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` NLP Engine: Online`);
  console.log(` Analytics Engine: Online`); 
});
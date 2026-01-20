const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = function(passport) {
  // 1. Email/Password Strategy
  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
      if (!user) return done(null, false, { message: 'Email not registered' });
      if (!user.passwordHash) return done(null, false, { message: 'Use Google Login' });

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (isMatch) return done(null, user);
      else return done(null, false, { message: 'Incorrect password' });
    } catch (err) {
      return done(err);
    }
  }));

  // 2. Google OAuth Strategy 
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
          return done(null, user);
        } else {
          // Create new user - strictly identity only
          const newUser = {
            googleId: profile.id,
            email: profile.emails[0].value,
          };
          user = await User.create(newUser);
          return done(null, user);
        }
      } catch (err) {
        console.error(err);
        return done(err, null);
      }
    }
  ));

  // Serialize/Deserialize for Sessions
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
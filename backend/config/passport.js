import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const configurePassport = () => {
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
    console.warn('Google OAuth environment variables are missing. Google login disabled.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('Google account email is required'));
          }

          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              firstName: profile.name?.givenName || profile.displayName || 'Google',
              lastName: profile.name?.familyName || 'User',
              email,
              password: accessToken + Date.now().toString(),
              avatar: {
                public_id: profile.id,
                url: profile.photos?.[0]?.value,
              },
              isVerified: true,
              googleId: profile.id,
            });
          } else if (!user.googleId) {
            user.googleId = profile.id;
            user.isVerified = true;
            await user.save();
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
};

export { configurePassport };

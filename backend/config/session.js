import session from 'express-session';
import MongoStore from 'connect-mongo';

const configureSession = () => {
  const sessionSecret = process.env.SESSION_SECRET;
  const mongoUri = process.env.MONGODB_URI;

  if (!sessionSecret) {
    throw new Error('SESSION_SECRET is not defined in environment variables');
  }

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  const isProd = process.env.NODE_ENV === 'production';
  const sessionTtlSeconds = Number(process.env.SESSION_TTL_SECONDS) || 24 * 60 * 60; // default 24h

  return session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoUri,
      collectionName: 'sessions',
      ttl: sessionTtlSeconds,
      autoRemove: 'native',
      autoRemoveInterval: 10, // minutes
    }),
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: sessionTtlSeconds * 1000,
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
    name: 'sessionId',
  });
};

export { configureSession };

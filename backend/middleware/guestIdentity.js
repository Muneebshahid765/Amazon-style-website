import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to ensure every request has either a logged-in user or a guest identifier.
 * Creates a signed httpOnly cookie with a UUID for anonymous visitors.
 */
export const ensureGuestIdentity = (req, res, next) => {
  // If user is authenticated, skip guest ID logic
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }

  // Check if guest already has a guestId cookie
  const existingGuestId = req.signedCookies?.guestId || req.cookies?.guestId;

  if (existingGuestId) {
    req.guestId = existingGuestId;
    return next();
  }

  // Generate new guest ID
  const newGuestId = `guest_${uuidv4()}`;
  
  // Set httpOnly signed cookie (expires in 30 days)
  res.cookie('guestId', newGuestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    signed: true,
  });

  req.guestId = newGuestId;
  next();
};

/**
 * Optional middleware: allows routes to work for both authenticated users and guests.
 * Does not block if no user is logged in.
 */
export const optionalAuth = (req, res, next) => {
  // Just pass through - either req.user or req.guestId will be set
  next();
};

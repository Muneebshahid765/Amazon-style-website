const protect = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authorized. Please log in.' });
  }
  next();
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Not permitted' });
  }
  next();
};

const checkAccountStatus = (req, res, next) => {
  if (!req.user?.isActive) {
    return res.status(403).json({ message: 'Account is deactivated' });
  }
  if (!req.user?.isVerified) {
    return res.status(403).json({ message: 'Email verification required' });
  }
  next();
};

export { protect, restrictTo, checkAccountStatus };

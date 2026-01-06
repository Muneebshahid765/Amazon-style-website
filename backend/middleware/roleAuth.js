export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin' && req.user.accountType !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

export const isSeller = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'seller' && req.user.accountType !== 'seller') {
    return res.status(403).json({ message: 'Seller access required' });
  }

  next();
};

export const isAdminOrSeller = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const allowedRoles = ['admin', 'seller'];
  const hasRole = allowedRoles.includes(req.user.role) || allowedRoles.includes(req.user.accountType);

  if (!hasRole) {
    return res.status(403).json({ message: 'Admin or Seller access required' });
  }

  next();
};

export const checkOwnership = (Model, paramName = 'id', ownerField = 'seller') => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin' || req.user.accountType === 'admin') {
        return next();
      }

      const resourceId = req.params[paramName];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      if (resource[ownerField].toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You do not have permission to access this resource' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

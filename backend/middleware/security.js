import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

const generateRequestId = (req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};

const sanitizeOutput = (data) => {
  if (typeof data === 'string') {
    return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeOutput);
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = sanitizeOutput(data[key]);
    }
    return sanitized;
  }
  return data;
};

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
};

const validateFileUpload = (allowedTypes, maxSize) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || [req.file];

    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        });
      }

      if (file.size > maxSize) {
        return res.status(400).json({
          message: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
        });
      }
    }

    next();
  };
};

export {
  authLimiter,
  apiLimiter,
  strictLimiter,
  generateRequestId,
  sanitizeOutput,
  securityHeaders,
  validateFileUpload,
};

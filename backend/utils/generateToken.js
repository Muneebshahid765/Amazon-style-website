import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES || '7d';

const getSecrets = () => {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new Error('JWT secrets are not configured');
  }

  return { accessSecret, refreshSecret };
};

const signToken = (payload, secret, expiresIn) => jwt.sign(payload, secret, { expiresIn });

const generateAuthTokens = (user) => {
  const { accessSecret, refreshSecret } = getSecrets();
  const payload = { sub: user._id, role: user.role };

  const accessToken = signToken(payload, accessSecret, ACCESS_EXPIRY);
  const refreshToken = signToken(
    { ...payload, tokenId: crypto.randomUUID() },
    refreshSecret,
    REFRESH_EXPIRY
  );

  return { accessToken, refreshToken };
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const verifyAccessToken = (token) => {
  const { accessSecret } = getSecrets();
  return jwt.verify(token, accessSecret);
};

const verifyRefreshToken = (token) => {
  const { refreshSecret } = getSecrets();
  return jwt.verify(token, refreshSecret);
};

const attachAuthCookies = (res, tokens) => {
  const isProd = process.env.NODE_ENV === 'production';
  const commonOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
  };

  res.cookie('accessToken', tokens.accessToken, {
    ...commonOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    ...commonOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookies = (res) => {
  const commonOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
  res.clearCookie('accessToken', commonOptions);
  res.clearCookie('refreshToken', commonOptions);
};

export {
  generateAuthTokens,
  verifyAccessToken,
  verifyRefreshToken,
  attachAuthCookies,
  clearAuthCookies,
  hashToken,
};

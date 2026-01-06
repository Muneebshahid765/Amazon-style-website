import { createClient } from 'redis';

let redisClient;
const inMemoryCache = new Map();

const setFallbackCache = (key, value, ttl = 3600) => {
  const expiresAt = Date.now() + ttl * 1000;
  inMemoryCache.set(key, { value, expiresAt });
};

const getFallbackCache = (key) => {
  const entry = inMemoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    inMemoryCache.delete(key);
    return null;
  }
  return entry.value;
};

const deleteFallbackCache = (key) => {
  inMemoryCache.delete(key);
};

const clearFallbackCachePattern = (pattern) => {
  const regex = new RegExp(pattern.replace('*', '.*'));
  Array.from(inMemoryCache.keys()).forEach((key) => {
    if (regex.test(key)) {
      inMemoryCache.delete(key);
    }
  });
};

const isRedisReady = () => redisClient && redisClient.isOpen;

const connectRedis = async () => {
  try {
    if (process.env.REDIS_URL) {
      redisClient = createClient({
        url: process.env.REDIS_URL,
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        console.log('Redis connected successfully');
      });

      await redisClient.connect();
    } else {
      console.log('Redis URL not provided, caching disabled');
    }
  } catch (error) {
    console.error('Redis connection error:', error);
  }
};

const getCache = async (key) => {
  if (!isRedisReady()) {
    return getFallbackCache(key);
  }

  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return getFallbackCache(key);
  }
};

const setCache = async (key, value, ttl = 3600) => {
  if (!isRedisReady()) {
    setFallbackCache(key, value, ttl);
    return true;
  }

  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    setFallbackCache(key, value, ttl);
    return false;
  }
};

const deleteCache = async (key) => {
  if (!isRedisReady()) {
    deleteFallbackCache(key);
    return true;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    deleteFallbackCache(key);
    return false;
  }
};

const clearCachePattern = async (pattern) => {
  if (!isRedisReady()) {
    clearFallbackCachePattern(pattern);
    return true;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Redis clear pattern error:', error);
    clearFallbackCachePattern(pattern);
    return false;
  }
};

const cacheMiddleware = (keyPrefix, ttl = 3600) => {
  return async (req, res, next) => {
    if (!redisClient || !redisClient.isOpen) {
      return next();
    }

    const key = `${keyPrefix}:${req.originalUrl}`;

    try {
      const cachedData = await getCache(key);

      if (cachedData) {
        return res.json(cachedData);
      }

      res.originalJson = res.json;
      res.json = function (data) {
        setCache(key, data, ttl);
        res.originalJson(data);
      };

      next();
    } catch (error) {
      next();
    }
  };
};

export {
  connectRedis,
  getCache,
  setCache,
  deleteCache,
  clearCachePattern,
  cacheMiddleware,
  redisClient,
};

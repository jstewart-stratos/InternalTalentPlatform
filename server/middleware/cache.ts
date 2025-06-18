import { Request, Response, NextFunction } from 'express';

// In-memory cache with TTL
interface CacheItem {
  data: any;
  expiry: number;
}

const cache = new Map<string, CacheItem>();

export const cacheMiddleware = (ttlSeconds: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.path}${JSON.stringify(req.query)}`;
    const cached = cache.get(key);
    
    if (cached && Date.now() < cached.expiry) {
      return res.json(cached.data);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Cache successful responses only
      if (res.statusCode === 200) {
        cache.set(key, {
          data,
          expiry: Date.now() + (ttlSeconds * 1000)
        });
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Clean expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(cache.entries());
  for (const [key, item] of entries) {
    if (now >= item.expiry) {
      cache.delete(key);
    }
  }
}, 60000); // Clean every minute

export const clearCache = (pattern?: string) => {
  if (pattern) {
    const keys = Array.from(cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};
import Redis from 'ioredis';

// Singleton Redis instance
let redisClient: Redis | null = null;
let useMemoryCache = false;

// Simple memory cache fallback
const memoryCache = new Map<string, { value: any, expiresAt: number | null }>();

export const getRedisClient = (): Redis | null => {
  if (useMemoryCache) return null;
  
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      commandTimeout: 2000,
      retryStrategy(times) {
        if (times > 2) {
          useMemoryCache = true;
          console.warn('⚠️ Redis unreachable. Falling back to Memory Cache.');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      }
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis Connection Error:', err.message);
      if (!useMemoryCache) {
        useMemoryCache = true;
        console.warn('⚠️ Switching to Memory Cache due to Redis error.');
      }
    });

    redisClient.on('connect', () => {
      console.warn('Redis connected successfully.');
      useMemoryCache = false;
    });
  }
  return redisClient;
};

// Initialize connection test
getRedisClient();

export const setCache = async (key: string, value: any, ttlSeconds?: number) => {
  const client = getRedisClient();
  const serializedValue = JSON.stringify(value);
  
  if (useMemoryCache || !client) {
    const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
    memoryCache.set(key, { value: serializedValue, expiresAt });
    return;
  }

  try {
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }
  } catch (error) {
    console.error('Redis SetCache Error:', error);
    // Fallback on error
    useMemoryCache = true;
    const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
    memoryCache.set(key, { value: serializedValue, expiresAt });
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const client = getRedisClient();
  let value: string | null = null;

  if (useMemoryCache || !client) {
    const cached = memoryCache.get(key);
    if (cached) {
      if (cached.expiresAt && Date.now() > cached.expiresAt) {
        memoryCache.delete(key);
        return null;
      }
      value = cached.value;
    }
  } else {
    try {
      value = await client.get(key);
    } catch (error) {
      console.error('Redis GetCache Error:', error);
      useMemoryCache = true;
      return null;
    }
  }

  if (!value) return null;
  
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  if (useMemoryCache) {
    memoryCache.delete(key);
    return;
  }
  const client = getRedisClient();
  if (!client) {
    memoryCache.delete(key);
    return;
  }
  try {
    await client.del(key);
  } catch (error) {
    console.error('Redis DeleteCache Error:', error);
    memoryCache.delete(key);
  }
};

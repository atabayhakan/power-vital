import Redis from 'ioredis';

// Singleton Redis instance
let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    redisClient.on('error', (err) => {
      console.error('Redis Connection Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully.');
    });
  }
  return redisClient;
};

export const setCache = async (key: string, value: any, ttlSeconds?: number) => {
  const client = getRedisClient();
  const serializedValue = JSON.stringify(value);
  if (ttlSeconds) {
    await client.setex(key, ttlSeconds, serializedValue);
  } else {
    await client.set(key, serializedValue);
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const client = getRedisClient();
  const value = await client.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return null;
  }
};

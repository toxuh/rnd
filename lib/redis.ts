import Redis from 'ioredis';
import { env, getRedisInfo } from './env-validation';

let redis: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redis) {
    const redisUrl = env.REDIS_URL;
    
    redis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Connection timeout
      connectTimeout: 10000,
      // Command timeout
      commandTimeout: 5000,
    });

    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
      console.error('Redis URL:', redisUrl);
    });

    redis.on('connect', () => {
      const redisInfo = getRedisInfo();
      console.log(`Redis connected successfully to ${redisInfo.host}:${redisInfo.port}`);
    });

    redis.on('ready', () => {
      console.log('Redis client ready');
    });

    redis.on('close', () => {
      console.log('Redis connection closed');
    });

    redis.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });
  }

  return redis;
};

export const closeRedisConnection = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
  }
};

/**
 * Check Redis connection health
 */
export const checkRedisHealth = async (): Promise<{
  connected: boolean;
  error?: string;
  latency?: number
}> => {
  try {
    const client = getRedisClient();
    const start = Date.now();

    // Test connection with ping
    const result = await client.ping();
    const latency = Date.now() - start;

    if (result === 'PONG') {
      return { connected: true, latency };
    } else {
      return { connected: false, error: 'Unexpected ping response' };
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Initialize Redis connection with retry logic
 */
export const initializeRedis = async (): Promise<boolean> => {
  try {
    const client = getRedisClient();

    // Try to connect
    await client.connect();

    // Test the connection
    const health = await checkRedisHealth();

    if (health.connected) {
      console.log(`✅ Redis initialized successfully (latency: ${health.latency}ms)`);
      return true;
    } else {
      console.error('❌ Redis health check failed:', health.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Redis initialization failed:', error);
    return false;
  }
};

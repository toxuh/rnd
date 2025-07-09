/**
 * Database Configuration
 * Centralized database connection and configuration
 */

export const databaseConfig = {
  // PostgreSQL Configuration
  postgres: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/rnd_db',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
    enableOfflineQueue: process.env.REDIS_OFFLINE_QUEUE !== 'false',
  },

  // Connection Pool Settings
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
    createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || '30000'),
    destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || '5000'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || '1000'),
  },
} as const;

export type DatabaseConfig = typeof databaseConfig;

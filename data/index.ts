/**
 * Data Layer Index
 * Central export for all data access modules
 */

// Database connections
export { prisma } from './prisma/prisma';
export { getRedisClient } from './redis/redis';

// Re-export for backward compatibility
export { prisma as db } from './prisma/prisma';
export { getRedisClient as redis } from './redis/redis';

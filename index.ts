/**
 * Application Index
 * Central export for the layered architecture
 */

// Configuration Layer
export * from './config';

// Data Layer
export * from './data';

// Core Layer
export * from './core/domain';
export * from './core/services';

// Infrastructure Layer
export * from './infrastructure';

// Presentation Layer
export * from './presentation/layouts';

// Shared Libraries
export * from './lib/types/common';
export * from './lib/constants';
export * from './lib/utils';

// Backward compatibility exports
export { prisma } from './data/prisma/prisma';
export { getRedisClient } from './data/redis/redis';
export { userApiKeyService } from './core/services/user-api-key-service';
export { authService } from './core/services/auth-service';
export { enhancedSecurityMiddleware } from './infrastructure/middleware/enhanced-security-middleware';

/**
 * Configuration Index
 * Central export for all configuration modules
 */

export { appConfig, type AppConfig } from './app';
export { databaseConfig, type DatabaseConfig } from './database';
export { securityConfig, type SecurityConfig } from './security';

// Re-export environment validation for backward compatibility
export * from '../lib/env-validation';

// Combined configuration object
export const config = {
  app: appConfig,
  database: databaseConfig,
  security: securityConfig,
} as const;

export type Config = typeof config;

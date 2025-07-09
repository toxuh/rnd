/**
 * Environment Variable Validation
 * Validates and provides defaults for environment variables
 */

export interface EnvConfig {
  // Database
  DATABASE_URL: string;
  
  // Redis
  REDIS_URL: string;
  
  // API Keys
  API_KEY_MAIN: string;
  API_KEY_ADMIN: string;
  API_KEY_LIMITED: string;
  DISABLE_API_KEY_AUTH: boolean;
  
  // Security
  ALLOWED_ORIGINS: string[];
  WEBHOOK_SECRET: string;
  JWT_SECRET: string;
  
  // Rate Limiting
  RATE_LIMIT_GLOBAL_MAX: number;
  RATE_LIMIT_RANDOM_MAX: number;
  RATE_LIMIT_STRICT_MAX: number;
  
  // Application
  MAX_REQUEST_SIZE: number;
  ENABLE_REQUEST_LOGGING: boolean;
  NODE_ENV: string;
  
  // ESP32
  RND_SERVER_URL?: string;
  
  // Frontend
  NEXT_PUBLIC_API_KEY?: string;
  NEXT_PUBLIC_APP_URL: string;
}

/**
 * Validate and parse environment variables
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = [];
  
  // Helper function to get required env var
  const getRequired = (key: string): string => {
    const value = process.env[key];
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
      return '';
    }
    return value;
  };
  
  // Helper function to get optional env var with default
  const getOptional = (key: string, defaultValue: string): string => {
    return process.env[key] || defaultValue;
  };
  
  // Helper function to parse boolean
  const getBoolean = (key: string, defaultValue: boolean): boolean => {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  };
  
  // Helper function to parse number
  const getNumber = (key: string, defaultValue: number): number => {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      errors.push(`Invalid number for environment variable: ${key}`);
      return defaultValue;
    }
    return parsed;
  };
  
  // Validate required variables
  const DATABASE_URL = getRequired('DATABASE_URL');
  const REDIS_URL = getOptional('REDIS_URL', 'redis://localhost:6379');
  
  // API Keys - generate defaults for development
  const API_KEY_MAIN = getOptional('API_KEY_MAIN', 'rnd_dev_main_key_12345');
  const API_KEY_ADMIN = getOptional('API_KEY_ADMIN', 'rnd_dev_admin_key_67890');
  const API_KEY_LIMITED = getOptional('API_KEY_LIMITED', 'rnd_dev_limited_key_abcde');
  const DISABLE_API_KEY_AUTH = getBoolean('DISABLE_API_KEY_AUTH', false);
  
  // Security
  const ALLOWED_ORIGINS_STR = getOptional('ALLOWED_ORIGINS', 'http://localhost:3000');
  const ALLOWED_ORIGINS = ALLOWED_ORIGINS_STR.split(',').map(origin => origin.trim());
  const WEBHOOK_SECRET = getOptional('WEBHOOK_SECRET', 'dev_webhook_secret_change_me');
  const JWT_SECRET = getOptional('JWT_SECRET', 'dev_jwt_secret_change_me_in_production');
  
  // Rate Limiting
  const RATE_LIMIT_GLOBAL_MAX = getNumber('RATE_LIMIT_GLOBAL_MAX', 100);
  const RATE_LIMIT_RANDOM_MAX = getNumber('RATE_LIMIT_RANDOM_MAX', 30);
  const RATE_LIMIT_STRICT_MAX = getNumber('RATE_LIMIT_STRICT_MAX', 10);
  
  // Application
  const MAX_REQUEST_SIZE = getNumber('MAX_REQUEST_SIZE', 10240);
  const ENABLE_REQUEST_LOGGING = getBoolean('ENABLE_REQUEST_LOGGING', true);
  const NODE_ENV = getOptional('NODE_ENV', 'development');
  
  // ESP32 (optional)
  const RND_SERVER_URL = process.env.RND_SERVER_URL;
  
  // Frontend
  const NEXT_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const NEXT_PUBLIC_APP_URL = getOptional('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
  
  // Production warnings
  if (NODE_ENV === 'production') {
    const productionWarnings: string[] = [];
    
    if (JWT_SECRET === 'dev_jwt_secret_change_me_in_production') {
      productionWarnings.push('JWT_SECRET is using default development value');
    }
    
    if (WEBHOOK_SECRET === 'dev_webhook_secret_change_me') {
      productionWarnings.push('WEBHOOK_SECRET is using default development value');
    }
    
    if (API_KEY_MAIN.startsWith('rnd_dev_')) {
      productionWarnings.push('API_KEY_MAIN is using development default');
    }
    
    if (!RND_SERVER_URL) {
      productionWarnings.push('RND_SERVER_URL is not configured');
    }
    
    if (productionWarnings.length > 0) {
      console.warn('🚨 Production Security Warnings:');
      productionWarnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  }
  
  // Development info
  if (NODE_ENV === 'development') {
    console.log('🔧 Development Environment Detected');
    if (!RND_SERVER_URL) {
      console.log('  - RND_SERVER_URL not configured (ESP32 features disabled)');
    }
    if (DISABLE_API_KEY_AUTH) {
      console.log('  - API key authentication is DISABLED');
    }
  }
  
  // Throw errors if any required variables are missing
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
  
  return {
    DATABASE_URL,
    REDIS_URL,
    API_KEY_MAIN,
    API_KEY_ADMIN,
    API_KEY_LIMITED,
    DISABLE_API_KEY_AUTH,
    ALLOWED_ORIGINS,
    WEBHOOK_SECRET,
    JWT_SECRET,
    RATE_LIMIT_GLOBAL_MAX,
    RATE_LIMIT_RANDOM_MAX,
    RATE_LIMIT_STRICT_MAX,
    MAX_REQUEST_SIZE,
    ENABLE_REQUEST_LOGGING,
    NODE_ENV,
    RND_SERVER_URL,
    NEXT_PUBLIC_API_KEY,
    NEXT_PUBLIC_APP_URL,
  };
}

// Export validated config
export const env = validateEnv();

/**
 * Check if ESP32 is configured and available
 */
export function isESP32Available(): boolean {
  return Boolean(env.RND_SERVER_URL);
}

/**
 * Get database connection info for logging
 */
export function getDatabaseInfo(): { host: string; database: string } {
  try {
    const url = new URL(env.DATABASE_URL);
    return {
      host: url.hostname,
      database: url.pathname.slice(1), // Remove leading slash
    };
  } catch {
    return { host: 'unknown', database: 'unknown' };
  }
}

/**
 * Get Redis connection info for logging
 */
export function getRedisInfo(): { host: string; port: number } {
  try {
    const url = new URL(env.REDIS_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

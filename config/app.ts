/**
 * Application Configuration
 * Main application settings and feature flags
 */

export const appConfig = {
  // Application Info
  name: process.env.APP_NAME || 'RND Generator',
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),

  // Feature Flags
  features: {
    enableAnalytics: process.env.ENABLE_ANALYTICS !== 'false',
    enableMonitoring: process.env.ENABLE_MONITORING !== 'false',
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    enableSecurityEvents: process.env.ENABLE_SECURITY_EVENTS !== 'false',
    enableAdminDashboard: process.env.ENABLE_ADMIN_DASHBOARD !== 'false',
  },

  // External Services
  services: {
    esp32: {
      url: process.env.RND_SERVER_URL || 'http://localhost:8080',
      timeout: parseInt(process.env.ESP32_TIMEOUT || '5000'),
      retries: parseInt(process.env.ESP32_RETRIES || '3'),
      healthCheckInterval: parseInt(process.env.ESP32_HEALTH_CHECK_INTERVAL || '30000'),
    },
  },

  // UI Configuration
  ui: {
    theme: process.env.DEFAULT_THEME || 'system',
    enableDarkMode: process.env.ENABLE_DARK_MODE !== 'false',
    enableAnimations: process.env.ENABLE_ANIMATIONS !== 'false',
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '10'),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100'),
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
    enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    maxFileSize: process.env.LOG_MAX_FILE_SIZE || '10MB',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600'), // 1 hour
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
    enableCompression: process.env.CACHE_COMPRESSION === 'true',
  },
} as const;

export type AppConfig = typeof appConfig;

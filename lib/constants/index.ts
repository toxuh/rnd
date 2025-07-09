/**
 * Application Constants
 * Centralized constants used across the application
 */

// API Constants
export const API_ROUTES = {
  AUTH: {
    SIGNIN: '/api/auth/signin',
    SIGNUP: '/api/auth/signup',
    SIGNOUT: '/api/auth/signout',
    SESSION: '/api/auth/session',
  },
  USER: {
    PROFILE: '/api/user/profile',
    API_KEYS: '/api/user/api-keys',
    USAGE: '/api/user/usage',
  },
  ADMIN: {
    USERS: '/api/admin/users',
    ANALYTICS: '/api/admin/analytics',
    SECURITY: '/api/admin/security',
  },
  RND: {
    PUBLIC: '/api/public/rnd',
    PRIVATE: '/api/rnd',
    ESP32: '/api/esp32/raw-string',
  },
} as const;

// UI Constants
export const UI_CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  },
  THEME: {
    DEFAULT: 'system',
    OPTIONS: ['light', 'dark', 'system'],
  },
  ANIMATION: {
    DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    },
  },
} as const;

// Security Constants
export const SECURITY_CONSTANTS = {
  API_KEY: {
    PREFIX: 'rnd_',
    LENGTH: 32,
    PREVIEW_LENGTH: 8,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    BCRYPT_ROUNDS: 12,
  },
  SESSION: {
    MAX_AGE: 30 * 24 * 60 * 60, // 30 days
    COOKIE_NAME: 'rnd-session',
  },
  RATE_LIMIT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    DEFAULT_MAX: 30,
  },
} as const;

// Error Constants
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Random Generation Constants
export const RND_CONSTANTS = {
  TYPES: [
    'number',
    'boolean',
    'float',
    'choice',
    'string',
    'color',
    'date',
    'uuid',
    'shuffle',
    'weighted-choice',
    'hsl-color',
    'gradient',
    'password',
  ] as const,
  CHARSET: {
    ALPHANUMERIC: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    ALPHA: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    NUMERIC: '0123456789',
    SYMBOLS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  },
  COLOR_FORMATS: ['hex', 'rgb', 'hsl'] as const,
} as const;

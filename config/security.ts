/**
 * Security Configuration
 * Centralized security settings and policies
 */

export const securityConfig = {
  // API Key Configuration
  apiKey: {
    maxKeysPerUser: parseInt(process.env.MAX_API_KEYS_PER_USER || '10'),
    defaultMaxRequests: parseInt(process.env.DEFAULT_MAX_REQUESTS || '10000'),
    defaultRateLimit: parseInt(process.env.DEFAULT_RATE_LIMIT || '100'),
    maxRateLimit: parseInt(process.env.MAX_RATE_LIMIT || '1000'),
    keyLength: parseInt(process.env.API_KEY_LENGTH || '32'),
    keyPrefix: process.env.API_KEY_PREFIX || 'rnd_',
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    maxRequests: {
      random: parseInt(process.env.RATE_LIMIT_RANDOM_MAX || '30'),
      auth: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10'),
      admin: parseInt(process.env.RATE_LIMIT_ADMIN_MAX || '100'),
    },
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
    skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === 'true',
  },

  // Authentication Configuration
  auth: {
    sessionSecret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '2592000'), // 30 days
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Security Headers
  headers: {
    contentSecurityPolicy: process.env.CSP_POLICY || "default-src 'self'",
    hsts: {
      maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'), // 1 year
      includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
      preload: process.env.HSTS_PRELOAD === 'true',
    },
  },

  // Monitoring Configuration
  monitoring: {
    enableSecurityEvents: process.env.ENABLE_SECURITY_EVENTS !== 'false',
    logLevel: process.env.SECURITY_LOG_LEVEL || 'info',
    alertThresholds: {
      failedLogins: parseInt(process.env.FAILED_LOGIN_THRESHOLD || '5'),
      rateLimitExceeded: parseInt(process.env.RATE_LIMIT_THRESHOLD || '10'),
      suspiciousActivity: parseInt(process.env.SUSPICIOUS_ACTIVITY_THRESHOLD || '3'),
    },
  },
} as const;

export type SecurityConfig = typeof securityConfig;

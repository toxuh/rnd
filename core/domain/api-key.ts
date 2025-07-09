/**
 * API Key Domain Model
 * Core API key business logic and types
 */

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  keyPreview: string;
  permissions: string[];
  rateLimit: number;
  maxRequests: number;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  totalRequests: number;
  lastRequestAt?: Date;
  userId: string;
}

export interface CreateApiKeyData {
  name: string;
  rateLimit?: number;
  maxRequests?: number;
  expiresAt?: Date;
  permissions?: string[];
}

export interface UpdateApiKeyData {
  name?: string;
  rateLimit?: number;
  maxRequests?: number;
  isActive?: boolean;
  expiresAt?: Date;
  permissions?: string[];
}

export interface ApiKeyUsage {
  keyId: string;
  totalRequests: number;
  remainingRequests: number;
  lastUsedAt?: Date;
  rateLimitRemaining: number;
  rateLimitReset: Date;
}

export interface ApiKeyPolicy {
  id: string;
  name: string;
  description?: string;
  maxKeysPerUser: number;
  defaultRateLimit: number;
  maxRateLimit: number;
  defaultMaxRequests: number;
  allowedEndpoints: string[];
  isActive: boolean;
}

// API Key validation rules
export const apiKeyValidation = {
  name: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_]+$/,
  },
  rateLimit: {
    min: 1,
    max: 1000,
  },
  maxRequests: {
    min: 1,
    max: 10000,
  },
  permissions: {
    validPatterns: ['random:*', 'admin:read', 'admin:write'],
  },
} as const;

// API Key business rules
export const apiKeyRules = {
  maxKeysPerUser: 10,
  defaultRateLimit: 100,
  maxRateLimit: 1000,
  defaultMaxRequests: 10000,
  keyLength: 32,
  keyPrefix: 'rnd_',
  defaultPermissions: ['random:*'],
  cacheTimeout: 3600, // 1 hour
} as const;

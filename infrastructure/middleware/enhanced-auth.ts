import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { prisma } from '../../data/prisma/prisma';
import { getRedisClient } from '../../data/redis/redis';
import { ApiKey, User } from '@prisma/client';

export interface AuthResult {
  success: boolean;
  error?: string;
  keyInfo?: ApiKeyInfo;
  user?: User;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  permissions: string[];
  rateLimit: number;
  userId?: string;
}

export class EnhancedApiKeyAuth {
  private redis = getRedisClient();

  /**
   * Hash an API key using SHA-256
   */
  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Generate a new API key
   */
  generateAPIKey(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return `rnd_${timestamp}_${random}`;
  }

  /**
   * Generate key preview (first 8 characters + "...")
   */
  private getKeyPreview(key: string): string {
    return `${key.substring(0, 12)}...`;
  }

  /**
   * Create a new API key in the database
   */
  async createApiKey(data: {
    name: string;
    permissions: string[];
    rateLimit?: number;
    userId?: string;
    expiresAt?: Date;
  }): Promise<{ key: string; apiKey: ApiKey }> {
    const key = this.generateAPIKey();
    const keyHash = this.hashKey(key);
    const keyPreview = this.getKeyPreview(key);

    const apiKey = await prisma.apiKey.create({
      data: {
        name: data.name,
        keyHash,
        keyPreview,
        permissions: data.permissions,
        rateLimit: data.rateLimit || 30,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });

    // Cache the key info in Redis for fast lookups
    await this.cacheKeyInfo(keyHash, {
      id: apiKey.id,
      name: apiKey.name,
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit,
      userId: apiKey.userId || undefined,
    });

    return { key, apiKey };
  }

  /**
   * Cache API key info in Redis for fast authentication
   */
  private async cacheKeyInfo(keyHash: string, keyInfo: ApiKeyInfo): Promise<void> {
    try {
      const cacheKey = `api_key:${keyHash}`;
      await this.redis.setex(cacheKey, 3600, JSON.stringify(keyInfo)); // Cache for 1 hour
    } catch (error) {
      console.error('Failed to cache API key info:', error);
    }
  }

  /**
   * Get API key info from cache or database
   */
  private async getKeyInfo(keyHash: string): Promise<ApiKeyInfo | null> {
    try {
      // Try Redis cache first
      const cacheKey = `api_key:${keyHash}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      // Fallback to database
      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: { user: true },
      });

      if (!apiKey || !apiKey.isActive) {
        return null;
      }

      // Check expiration
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return null;
      }

      const keyInfo: ApiKeyInfo = {
        id: apiKey.id,
        name: apiKey.name,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        userId: apiKey.userId || undefined,
      };

      // Cache for future requests
      await this.cacheKeyInfo(keyHash, keyInfo);

      return keyInfo;
    } catch (error) {
      console.error('Failed to get API key info:', error);
      return null;
    }
  }

  /**
   * Update last used timestamp and increment request count for an API key
   */
  private async updateLastUsed(keyId: string): Promise<void> {
    try {
      // Use background update to avoid blocking the request
      prisma.apiKey.update({
        where: { id: keyId },
        data: {
          lastUsedAt: new Date(),
          lastRequestAt: new Date(),
          totalRequests: { increment: 1 }
        },
      }).catch(error => {
        console.error('Failed to update API key usage stats:', error);
      });
    } catch (error) {
      console.error('Failed to update last used timestamp:', error);
    }
  }

  /**
   * Authenticate API key and check permissions
   */
  async authenticate(req: NextRequest, requiredPermission?: string): Promise<AuthResult> {
    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
      return {
        success: false,
        error: 'API key is required',
      };
    }

    const keyHash = this.hashKey(apiKey);
    const keyInfo = await this.getKeyInfo(keyHash);

    if (!keyInfo) {
      return {
        success: false,
        error: 'Invalid API key',
      };
    }

    // Check permissions if required
    if (requiredPermission && !this.hasPermission(keyInfo.permissions, requiredPermission)) {
      return {
        success: false,
        error: 'Insufficient permissions',
      };
    }

    // Update last used timestamp (async, non-blocking)
    this.updateLastUsed(keyInfo.id);

    // Get user info if available
    let user: User | undefined;
    if (keyInfo.userId) {
      try {
        user = await prisma.user.findUnique({
          where: { id: keyInfo.userId },
        }) || undefined;
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    }

    return {
      success: true,
      keyInfo,
      user,
    };
  }

  /**
   * Check if permissions array includes the required permission
   */
  private hasPermission(permissions: string[], required: string): boolean {
    // Check for wildcard permission
    if (permissions.includes('*')) {
      return true;
    }

    // Check for exact match
    if (permissions.includes(required)) {
      return true;
    }

    // Check for wildcard patterns (e.g., "random:*" matches "random:read")
    const [requiredNamespace, requiredAction] = required.split(':');
    const wildcardPermission = `${requiredNamespace}:*`;

    return permissions.includes(wildcardPermission);
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(keyId: string): Promise<boolean> {
    try {
      const apiKey = await prisma.apiKey.update({
        where: { id: keyId },
        data: { isActive: false },
      });

      // Remove from cache
      const cacheKey = `api_key:${apiKey.keyHash}`;
      await this.redis.del(cacheKey);

      return true;
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      return false;
    }
  }

  /**
   * List API keys for a user
   */
  async listApiKeys(userId?: string): Promise<ApiKey[]> {
    try {
      return await prisma.apiKey.findMany({
        where: userId ? { userId } : {},
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Failed to list API keys:', error);
      return [];
    }
  }
}

// Export singleton instance
export const enhancedApiKeyAuth = new EnhancedApiKeyAuth();

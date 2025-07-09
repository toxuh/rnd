import { createHash } from 'crypto';
import { prisma } from './prisma';
import { getRedisClient } from './redis';
import { ApiKey } from '@prisma/client';

export interface CreateApiKeyData {
  name: string;
  rateLimit?: number;
  expiresAt?: Date;
}

export interface ApiKeyWithStats extends ApiKey {
  stats?: {
    totalRequests: number;
    lastUsed?: Date;
    averageResponseTime?: number;
  };
}

export class UserApiKeyService {
  private redis = getRedisClient();
  private readonly MAX_KEYS_PER_USER = 5; // Default limit
  private readonly DEFAULT_RATE_LIMIT = 100; // requests per minute
  private readonly MAX_RATE_LIMIT = 1000; // maximum allowed rate limit

  /**
   * Hash an API key using SHA-256
   */
  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Generate a new API key
   */
  private generateAPIKey(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    const moreRandom = Math.random().toString(36).substring(2, 15);
    return `rnd_${timestamp}_${random}${moreRandom}`;
  }

  /**
   * Get API key preview (first 12 characters + ...)
   */
  private getKeyPreview(key: string): string {
    return `${key.substring(0, 12)}...`;
  }

  /**
   * Get user's API key policy limits
   */
  private async getUserLimits(userId: string): Promise<{
    maxKeys: number;
    defaultRateLimit: number;
    maxRateLimit: number;
  }> {
    try {
      // For now, use default limits. Later can be customized per user/plan
      const policy = await prisma.apiKeyPolicy.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      return {
        maxKeys: policy?.maxKeysPerUser || this.MAX_KEYS_PER_USER,
        defaultRateLimit: policy?.defaultRateLimit || this.DEFAULT_RATE_LIMIT,
        maxRateLimit: policy?.maxRateLimit || this.MAX_RATE_LIMIT,
      };
    } catch (error) {
      console.error('Failed to get user limits:', error);
      return {
        maxKeys: this.MAX_KEYS_PER_USER,
        defaultRateLimit: this.DEFAULT_RATE_LIMIT,
        maxRateLimit: this.MAX_RATE_LIMIT,
      };
    }
  }

  /**
   * Create a new API key for a user
   */
  async createApiKey(userId: string, data: CreateApiKeyData): Promise<{
    success: boolean;
    key?: string;
    apiKey?: ApiKey;
    error?: string;
  }> {
    try {
      const limits = await this.getUserLimits(userId);

      // Check if user has reached the maximum number of keys
      const existingKeysCount = await prisma.apiKey.count({
        where: { userId, isActive: true },
      });

      if (existingKeysCount >= limits.maxKeys) {
        return {
          success: false,
          error: `Maximum of ${limits.maxKeys} API keys allowed per user`,
        };
      }

      // Validate rate limit
      const rateLimit = data.rateLimit || limits.defaultRateLimit;
      if (rateLimit > limits.maxRateLimit) {
        return {
          success: false,
          error: `Rate limit cannot exceed ${limits.maxRateLimit} requests per minute`,
        };
      }

      // Check for duplicate names
      const existingKey = await prisma.apiKey.findFirst({
        where: {
          userId,
          name: data.name,
          isActive: true,
        },
      });

      if (existingKey) {
        return {
          success: false,
          error: 'API key with this name already exists',
        };
      }

      // Generate new key
      const key = this.generateAPIKey();
      const keyHash = this.hashKey(key);
      const keyPreview = this.getKeyPreview(key);

      // Create API key in database
      const apiKey = await prisma.apiKey.create({
        data: {
          name: data.name,
          keyHash,
          keyPreview,
          permissions: ['random:*'], // Default permissions for user-generated keys
          rateLimit,
          userId,
          expiresAt: data.expiresAt,
        },
      });

      // Cache the key info in Redis for fast lookups
      await this.cacheKeyInfo(keyHash, {
        id: apiKey.id,
        name: apiKey.name,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        userId: apiKey.userId,
      });

      return {
        success: true,
        key,
        apiKey,
      };
    } catch (error) {
      console.error('Failed to create API key:', error);
      return {
        success: false,
        error: 'Failed to create API key',
      };
    }
  }

  /**
   * Cache API key info in Redis for fast authentication
   */
  private async cacheKeyInfo(keyHash: string, keyInfo: {
    id: string;
    name: string;
    permissions: string[];
    rateLimit: number;
    userId: string;
  }): Promise<void> {
    try {
      const cacheKey = `api_key:${keyHash}`;
      await this.redis.setex(cacheKey, 3600, JSON.stringify(keyInfo)); // Cache for 1 hour
    } catch (error) {
      console.error('Failed to cache API key info:', error);
    }
  }

  /**
   * Get user's API keys with usage statistics
   */
  async getUserApiKeys(userId: string): Promise<ApiKeyWithStats[]> {
    try {
      const apiKeys = await prisma.apiKey.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      // Get usage statistics for each key
      const keysWithStats: ApiKeyWithStats[] = await Promise.all(
        apiKeys.map(async (key) => {
          const stats = await this.getKeyUsageStats(key.id);
          return {
            ...key,
            stats,
          };
        })
      );

      return keysWithStats;
    } catch (error) {
      console.error('Failed to get user API keys:', error);
      return [];
    }
  }

  /**
   * Get usage statistics for an API key
   */
  private async getKeyUsageStats(keyId: string): Promise<{
    totalRequests: number;
    lastUsed?: Date;
    averageResponseTime?: number;
  }> {
    try {
      const stats = await prisma.usageRecord.aggregate({
        where: { apiKeyId: keyId },
        _count: { id: true },
        _avg: { responseTime: true },
      });

      const lastUsage = await prisma.usageRecord.findFirst({
        where: { apiKeyId: keyId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      return {
        totalRequests: stats._count.id || 0,
        lastUsed: lastUsage?.createdAt,
        averageResponseTime: stats._avg.responseTime || undefined,
      };
    } catch (error) {
      console.error('Failed to get key usage stats:', error);
      return { totalRequests: 0 };
    }
  }

  /**
   * Update an API key
   */
  async updateApiKey(userId: string, keyId: string, data: {
    name?: string;
    rateLimit?: number;
    isActive?: boolean;
  }): Promise<{ success: boolean; apiKey?: ApiKey; error?: string }> {
    try {
      // Verify the key belongs to the user
      const existingKey = await prisma.apiKey.findFirst({
        where: { id: keyId, userId },
      });

      if (!existingKey) {
        return { success: false, error: 'API key not found' };
      }

      const limits = await this.getUserLimits(userId);

      // Validate rate limit if provided
      if (data.rateLimit && data.rateLimit > limits.maxRateLimit) {
        return {
          success: false,
          error: `Rate limit cannot exceed ${limits.maxRateLimit} requests per minute`,
        };
      }

      // Check for duplicate names if name is being changed
      if (data.name && data.name !== existingKey.name) {
        const duplicateKey = await prisma.apiKey.findFirst({
          where: {
            userId,
            name: data.name,
            isActive: true,
            NOT: { id: keyId },
          },
        });

        if (duplicateKey) {
          return {
            success: false,
            error: 'API key with this name already exists',
          };
        }
      }

      // Update the key
      const updatedKey = await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.rateLimit && { rateLimit: data.rateLimit }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      // Update cache if key is still active
      if (updatedKey.isActive) {
        await this.cacheKeyInfo(updatedKey.keyHash, {
          id: updatedKey.id,
          name: updatedKey.name,
          permissions: updatedKey.permissions,
          rateLimit: updatedKey.rateLimit,
          userId: updatedKey.userId,
        });
      } else {
        // Remove from cache if deactivated
        const cacheKey = `api_key:${updatedKey.keyHash}`;
        await this.redis.del(cacheKey);
      }

      return { success: true, apiKey: updatedKey };
    } catch (error) {
      console.error('Failed to update API key:', error);
      return { success: false, error: 'Failed to update API key' };
    }
  }

  /**
   * Delete (deactivate) an API key
   */
  async deleteApiKey(userId: string, keyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify the key belongs to the user
      const existingKey = await prisma.apiKey.findFirst({
        where: { id: keyId, userId },
      });

      if (!existingKey) {
        return { success: false, error: 'API key not found' };
      }

      // Deactivate the key (soft delete)
      await prisma.apiKey.update({
        where: { id: keyId },
        data: { isActive: false },
      });

      // Remove from cache
      const cacheKey = `api_key:${existingKey.keyHash}`;
      await this.redis.del(cacheKey);

      return { success: true };
    } catch (error) {
      console.error('Failed to delete API key:', error);
      return { success: false, error: 'Failed to delete API key' };
    }
  }

  /**
   * Get API key usage analytics
   */
  async getKeyAnalytics(userId: string, keyId: string, timeRange: number = 24 * 60 * 60 * 1000): Promise<{
    success: boolean;
    analytics?: {
      totalRequests: number;
      successRate: number;
      averageResponseTime: number;
      requestsByEndpoint: Record<string, number>;
      requestsOverTime: Array<{ date: string; count: number }>;
    };
    error?: string;
  }> {
    try {
      // Verify the key belongs to the user
      const apiKey = await prisma.apiKey.findFirst({
        where: { id: keyId, userId },
      });

      if (!apiKey) {
        return { success: false, error: 'API key not found' };
      }

      const since = new Date(Date.now() - timeRange);

      // Get usage records
      const records = await prisma.usageRecord.findMany({
        where: {
          apiKeyId: keyId,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate analytics
      const totalRequests = records.length;
      const successCount = records.filter(r => r.statusCode < 400).length;
      const totalResponseTime = records.reduce((sum, r) => sum + r.responseTime, 0);

      const requestsByEndpoint: Record<string, number> = {};
      records.forEach(record => {
        requestsByEndpoint[record.endpoint] = (requestsByEndpoint[record.endpoint] || 0) + 1;
      });

      // Requests over time (daily buckets)
      const requestsOverTime = await this.getRequestsOverTime(keyId, since);

      return {
        success: true,
        analytics: {
          totalRequests,
          successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
          averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
          requestsByEndpoint,
          requestsOverTime,
        },
      };
    } catch (error) {
      console.error('Failed to get key analytics:', error);
      return { success: false, error: 'Failed to get analytics' };
    }
  }

  /**
   * Get requests over time for an API key
   */
  private async getRequestsOverTime(keyId: string, since: Date): Promise<Array<{ date: string; count: number }>> {
    try {
      const result = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM usage_records 
        WHERE api_key_id = ${keyId} AND created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      return result.map(row => ({
        date: row.date,
        count: Number(row.count),
      }));
    } catch (error) {
      console.error('Failed to get requests over time:', error);
      return [];
    }
  }
}

// Export singleton instance
export const userApiKeyService = new UserApiKeyService();

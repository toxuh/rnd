import { userApiKeyService } from '../../core/services/user-api-key-service';
import { prisma } from '../../data/prisma/prisma';

// Mock Prisma
jest.mock('../../data/prisma/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    apiKeyPolicy: {
      findFirst: jest.fn(),
    },
  },
}));

// Mock Redis
jest.mock('../../data/redis/redis', () => ({
  getRedisClient: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
  })),
}));

describe('UserApiKeyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkRequestLimit', () => {
    it('should allow requests when under limit', async () => {
      const mockApiKey = {
        totalRequests: 5000,
        maxRequests: 10000,
        isActive: true,
      };

      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const result = await userApiKeyService.checkRequestLimit('test-hash');

      expect(result).toEqual({
        allowed: true,
        remaining: 5000,
        total: 5000,
        maxRequests: 10000,
      });
    });

    it('should deny requests when limit exceeded', async () => {
      const mockApiKey = {
        totalRequests: 10000,
        maxRequests: 10000,
        isActive: true,
      };

      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const result = await userApiKeyService.checkRequestLimit('test-hash');

      expect(result).toEqual({
        allowed: false,
        remaining: 0,
        total: 10000,
        maxRequests: 10000,
      });
    });

    it('should deny requests for inactive API key', async () => {
      const mockApiKey = {
        totalRequests: 1000,
        maxRequests: 10000,
        isActive: false,
      };

      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      const result = await userApiKeyService.checkRequestLimit('test-hash');

      expect(result).toEqual({
        allowed: false,
        remaining: 0,
        total: 0,
        maxRequests: 0,
      });
    });

    it('should deny requests for non-existent API key', async () => {
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userApiKeyService.checkRequestLimit('test-hash');

      expect(result).toEqual({
        allowed: false,
        remaining: 0,
        total: 0,
        maxRequests: 0,
      });
    });
  });

  describe('incrementRequestCount', () => {
    it('should increment request count successfully', async () => {
      (prisma.apiKey.update as jest.Mock).mockResolvedValue({});

      const result = await userApiKeyService.incrementRequestCount('test-hash');

      expect(result).toBe(true);
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { keyHash: 'test-hash' },
        data: {
          totalRequests: { increment: 1 },
          lastUsedAt: expect.any(Date),
          lastRequestAt: expect.any(Date),
        },
      });
    });

    it('should handle increment errors gracefully', async () => {
      (prisma.apiKey.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await userApiKeyService.incrementRequestCount('test-hash');

      expect(result).toBe(false);
    });
  });

  describe('createApiKey', () => {
    it('should create API key with default maxRequests', async () => {
      const mockUser = 'user-123';
      const mockData = {
        name: 'Test Key',
        rateLimit: 100,
      };

      (prisma.apiKey.count as jest.Mock).mockResolvedValue(2); // Under limit
      (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null); // No duplicate
      (prisma.apiKeyPolicy.findFirst as jest.Mock).mockResolvedValue(null); // Use defaults
      (prisma.apiKey.create as jest.Mock).mockResolvedValue({
        id: 'key-123',
        name: 'Test Key',
        maxRequests: 10000,
      });

      const result = await userApiKeyService.createApiKey(mockUser, mockData);

      expect(result.success).toBe(true);
      expect(prisma.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Key',
          rateLimit: 100,
          maxRequests: 10000, // Default value
        }),
      });
    });

    it('should create API key with custom maxRequests', async () => {
      const mockUser = 'user-123';
      const mockData = {
        name: 'Test Key',
        rateLimit: 100,
        maxRequests: 5000,
      };

      (prisma.apiKey.count as jest.Mock).mockResolvedValue(2);
      (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.apiKeyPolicy.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.apiKey.create as jest.Mock).mockResolvedValue({
        id: 'key-123',
        name: 'Test Key',
        maxRequests: 5000,
      });

      const result = await userApiKeyService.createApiKey(mockUser, mockData);

      expect(result.success).toBe(true);
      expect(prisma.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Key',
          rateLimit: 100,
          maxRequests: 5000,
        }),
      });
    });

    it('should reject when user has reached maximum keys (10)', async () => {
      const mockUser = 'user-123';
      const mockData = {
        name: 'Test Key',
      };

      (prisma.apiKey.count as jest.Mock).mockResolvedValue(10); // At limit
      (prisma.apiKeyPolicy.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await userApiKeyService.createApiKey(mockUser, mockData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Maximum of 10 API keys allowed per user');
    });
  });
});

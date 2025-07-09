import { NextRequest } from 'next/server';
import { SecurityMiddleware } from '../security-middleware';

// Mock Redis
jest.mock('../redis', () => ({
  getRedisClient: jest.fn(() => ({
    pipeline: jest.fn(() => ({
      zremrangebyscore: jest.fn(),
      zcard: jest.fn(),
      zadd: jest.fn(),
      expire: jest.fn(),
      exec: jest.fn().mockResolvedValue([
        [null, 0], // zremrangebyscore
        [null, 5], // zcard (current count)
        [null, 1], // zadd
        [null, 1], // expire
      ]),
    })),
    zrem: jest.fn(),
  })),
}));

// Mock security monitor
jest.mock('../security-monitor', () => ({
  securityMonitor: {
    extractRequestInfo: jest.fn(() => ({ ip: '127.0.0.1', userAgent: 'test-agent' })),
    detectSuspiciousActivity: jest.fn().mockResolvedValue(false),
    logSecurityEvent: jest.fn(),
  },
}));

// Mock API key auth
jest.mock('../auth', () => ({
  apiKeyAuth: {
    authenticate: jest.fn().mockResolvedValue({
      success: true,
      keyInfo: { name: 'test-key', permissions: ['*'] },
    }),
    validateOrigin: jest.fn().mockReturnValue(true),
  },
}));

describe('SecurityMiddleware', () => {
  let securityMiddleware: SecurityMiddleware;

  beforeEach(() => {
    securityMiddleware = new SecurityMiddleware();
    jest.clearAllMocks();
  });

  const createMockRequest = (url: string, options: RequestInit = {}) => {
    return new NextRequest(new Request(`http://localhost${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-key',
        ...options.headers,
      },
      ...options,
    }));
  };

  describe('validateRequest', () => {
    it('should pass validation with valid request', async () => {
      const req = createMockRequest('/api/rnd/number');
      const body = JSON.stringify({ min: 1, max: 10 });

      const result = await securityMiddleware.validateRequest(req, {}, body);

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
    });

    it('should reject oversized requests', async () => {
      const req = createMockRequest('/api/rnd/number');
      const body = 'x'.repeat(20000); // Larger than default 10KB limit

      const result = await securityMiddleware.validateRequest(req, {
        maxBodySize: 10240,
      }, body);

      expect(result.success).toBe(false);
      expect(result.response?.status).toBe(413);
    });

    it('should handle authentication failure', async () => {
      const { apiKeyAuth } = require('../auth');
      apiKeyAuth.authenticate.mockResolvedValueOnce({
        success: false,
        error: 'Invalid API key',
      });

      const req = createMockRequest('/api/rnd/number');
      const body = JSON.stringify({ min: 1, max: 10 });

      const result = await securityMiddleware.validateRequest(req, {
        requireAuth: true,
      }, body);

      expect(result.success).toBe(false);
      expect(result.response?.status).toBe(401);
    });

    it('should handle rate limit exceeded', async () => {
      // Mock rate limiter to return failure
      const mockRateLimiter = {
        checkLimit: jest.fn().mockResolvedValue({
          success: false,
          limit: 30,
          remaining: 0,
          resetTime: Date.now() + 60000,
          retryAfter: 60,
        }),
      };

      // Override the rate limiter
      securityMiddleware['rateLimiters'] = {
        random: mockRateLimiter,
        global: mockRateLimiter,
        strict: mockRateLimiter,
      };

      const req = createMockRequest('/api/rnd/number');
      const body = JSON.stringify({ min: 1, max: 10 });

      const result = await securityMiddleware.validateRequest(req, {
        rateLimitType: 'random',
      }, body);

      expect(result.success).toBe(false);
      expect(result.response?.status).toBe(429);
    });

    it('should reject suspicious requests', async () => {
      const { securityMonitor } = require('../security-monitor');
      securityMonitor.detectSuspiciousActivity.mockResolvedValueOnce(true);

      const req = createMockRequest('/api/rnd/number');
      const body = JSON.stringify({ min: 1, max: 10 });

      const result = await securityMiddleware.validateRequest(req, {}, body);

      expect(result.success).toBe(false);
      expect(result.response?.status).toBe(403);
    });
  });

  describe('addSecurityHeaders', () => {
    it('should add all required security headers', () => {
      const mockResponse = {
        headers: new Map(),
      } as any;

      mockResponse.headers.set = jest.fn();

      const result = securityMiddleware.addSecurityHeaders(mockResponse);

      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    });
  });

  describe('handleCORS', () => {
    it('should return proper CORS response', () => {
      const response = securityMiddleware.handleCORS();

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with security headers', () => {
      const response = securityMiddleware.createErrorResponse('Test error', 400);

      expect(response.status).toBe(400);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response with security headers and metadata', () => {
      const data = { result: 42 };
      const metadata = { rateLimitRemaining: 25, keyName: 'test-key' };

      const response = securityMiddleware.createSuccessResponse(data, metadata);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('25');
      expect(response.headers.get('X-API-Key-Name')).toBe('test-key');
    });
  });
});

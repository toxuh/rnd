import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiters } from './rate-limiter';
import { apiKeyAuth } from './auth';
import { securityMonitor } from './security-monitor';

export interface SecurityConfig {
  requireAuth?: boolean;
  requiredPermission?: string;
  rateLimitType?: 'global' | 'random' | 'strict';
  validateOrigin?: boolean;
  validateSignature?: boolean;
  maxBodySize?: number;
}

export interface SecurityResult {
  success: boolean;
  response?: NextResponse;
  error?: string;
  metadata?: {
    rateLimitRemaining?: number;
    rateLimitReset?: number;
    keyName?: string;
  };
}

export class SecurityMiddleware {
  private rateLimiters = createRateLimiters();

  async validateRequest(
    req: NextRequest,
    config: SecurityConfig = {},
    body?: string
  ): Promise<SecurityResult> {
    const {
      requireAuth = true,
      requiredPermission = 'random:read',
      rateLimitType = 'random',
      validateOrigin = false,
      validateSignature = false,
      maxBodySize = 1024 * 10, // 10KB default
    } = config;

    try {
      const { ip, userAgent } = securityMonitor.extractRequestInfo(req);

      // 0. Check for blocked IPs and suspicious activity
      if (await securityMonitor.detectSuspiciousActivity(req)) {
        await securityMonitor.logSecurityEvent({
          type: 'suspicious_request',
          ip,
          userAgent,
          endpoint: req.nextUrl.pathname,
          timestamp: Date.now(),
        });

        return {
          success: false,
          response: NextResponse.json(
            { error: 'Request blocked' },
            { status: 403 }
          ),
        };
      }

      // 1. Validate request size
      if (body && Buffer.byteLength(body, 'utf8') > maxBodySize) {
        await securityMonitor.logSecurityEvent({
          type: 'large_payload',
          ip,
          userAgent,
          endpoint: req.nextUrl.pathname,
          timestamp: Date.now(),
          details: { size: Buffer.byteLength(body, 'utf8'), limit: maxBodySize },
        });

        return {
          success: false,
          response: NextResponse.json(
            { error: 'Request body too large' },
            { status: 413 }
          ),
        };
      }

      // 2. Validate origin if required
      if (validateOrigin && !apiKeyAuth.validateOrigin(req)) {
        await securityMonitor.logSecurityEvent({
          type: 'blocked_origin',
          ip,
          userAgent,
          endpoint: req.nextUrl.pathname,
          timestamp: Date.now(),
          details: { origin: req.headers.get('origin') },
        });

        return {
          success: false,
          response: NextResponse.json(
            { error: 'Origin not allowed' },
            { status: 403 }
          ),
        };
      }

      // 3. Validate signature if required
      if (validateSignature && body && !apiKeyAuth.validateSignature(req, body)) {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          ),
        };
      }

      // 4. Authenticate API key
      let keyInfo;
      if (requireAuth) {
        const authResult = await apiKeyAuth.authenticate(req, requiredPermission);
        if (!authResult.success) {
          await securityMonitor.logSecurityEvent({
            type: 'invalid_api_key',
            ip,
            userAgent,
            endpoint: req.nextUrl.pathname,
            timestamp: Date.now(),
            details: { error: authResult.error },
          });

          return {
            success: false,
            response: NextResponse.json(
              { error: authResult.error },
              { status: 401 }
            ),
          };
        }
        keyInfo = authResult.keyInfo;
      }

      // 5. Apply rate limiting
      const rateLimiter = this.rateLimiters[rateLimitType];
      const rateLimitResult = await rateLimiter.checkLimit(req);

      if (!rateLimitResult.success) {
        await securityMonitor.logSecurityEvent({
          type: 'rate_limit_exceeded',
          ip,
          userAgent,
          endpoint: req.nextUrl.pathname,
          timestamp: Date.now(),
          details: {
            limit: rateLimitResult.limit,
            retryAfter: rateLimitResult.retryAfter,
            rateLimitType
          },
        });

        const response = NextResponse.json(
          {
            error: 'Rate limit exceeded',
            retryAfter: rateLimitResult.retryAfter,
          },
          { status: 429 }
        );

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
        response.headers.set('Retry-After', (rateLimitResult.retryAfter || 60).toString());

        return {
          success: false,
          response,
        };
      }

      // 6. Success - return metadata for response headers
      return {
        success: true,
        metadata: {
          rateLimitRemaining: rateLimitResult.remaining,
          rateLimitReset: rateLimitResult.resetTime,
          keyName: keyInfo?.name,
        },
      };
    } catch (error) {
      console.error('Security middleware error:', error);
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Security validation failed' },
          { status: 500 }
        ),
      };
    }
  }

  addSecurityHeaders(response: NextResponse, metadata?: SecurityResult['metadata']): NextResponse {
    // Rate limiting headers
    if (metadata?.rateLimitRemaining !== undefined) {
      response.headers.set('X-RateLimit-Remaining', metadata.rateLimitRemaining.toString());
    }
    if (metadata?.rateLimitReset) {
      response.headers.set('X-RateLimit-Reset', metadata.rateLimitReset.toString());
    }

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // CORS headers for API
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
    if (allowedOrigins.includes('*')) {
      response.headers.set('Access-Control-Allow-Origin', '*');
    } else {
      // In production, you'd want to check the actual origin
      response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key, authorization');
    response.headers.set('Access-Control-Max-Age', '86400');

    // Add custom header to identify requests processed by this app
    response.headers.set('X-Powered-By', 'RND-Security-Layer');
    
    if (metadata?.keyName) {
      response.headers.set('X-API-Key-Name', metadata.keyName);
    }

    return response;
  }

  // Method to handle OPTIONS requests for CORS
  handleCORS(): NextResponse {
    const response = new NextResponse(null, { status: 200 });
    return this.addSecurityHeaders(response);
  }

  // Method to create error responses with security headers
  createErrorResponse(error: string, status: number = 400): NextResponse {
    const response = NextResponse.json({ error }, { status });
    return this.addSecurityHeaders(response);
  }

  // Method to create success responses with security headers
  createSuccessResponse(data: unknown, metadata?: SecurityResult['metadata']): NextResponse {
    const response = NextResponse.json(data);
    return this.addSecurityHeaders(response, metadata);
  }
}

// Singleton instance
export const securityMiddleware = new SecurityMiddleware();

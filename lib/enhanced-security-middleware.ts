import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiters } from './rate-limiter';
import { enhancedApiKeyAuth } from './enhanced-auth';
import { enhancedSecurityMonitor } from './enhanced-security-monitor';
import { usageAnalytics } from './usage-analytics';
import { SecurityEventType, EventSeverity } from '@prisma/client';

export interface EnhancedSecurityConfig {
  requireAuth?: boolean;
  requiredPermission?: string;
  rateLimitType?: 'global' | 'random' | 'strict';
  validateOrigin?: boolean;
  validateSignature?: boolean;
  maxBodySize?: number;
  logUsage?: boolean;
  logRequestHistory?: boolean;
}

export interface EnhancedSecurityResult {
  success: boolean;
  response?: NextResponse;
  error?: string;
  metadata?: {
    rateLimitRemaining?: number;
    rateLimitReset?: number;
    keyName?: string;
    userId?: string;
  };
}

export class EnhancedSecurityMiddleware {
  private rateLimiters = createRateLimiters();

  async validateRequest(
    req: NextRequest,
    config: EnhancedSecurityConfig = {},
    body?: string
  ): Promise<EnhancedSecurityResult> {
    const startTime = Date.now();
    const {
      requireAuth = true,
      requiredPermission = 'random:read',
      rateLimitType = 'random',
      validateOrigin = false,
      validateSignature = false,
      maxBodySize = 1024 * 10, // 10KB default
      logUsage = true,
      logRequestHistory = false,
    } = config;

    try {
      const { ip, userAgent } = enhancedSecurityMonitor.extractRequestInfo(req);

      // 0. Check for blocked IPs and suspicious activity
      if (await enhancedSecurityMonitor.detectSuspiciousActivity(req)) {
        await enhancedSecurityMonitor.logSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_REQUEST,
          ip,
          userAgent,
          endpoint: req.nextUrl.pathname,
          severity: EventSeverity.HIGH,
        });

        return {
          success: false,
          response: NextResponse.json(
            { error: 'Request blocked' },
            { status: 403 }
          ),
        };
      }

      // 1. Validate request body size
      if (body && body.length > maxBodySize) {
        await enhancedSecurityMonitor.logSecurityEvent({
          type: SecurityEventType.LARGE_PAYLOAD,
          ip,
          userAgent,
          endpoint: req.nextUrl.pathname,
          details: { bodySize: body.length, maxSize: maxBodySize },
          severity: EventSeverity.MEDIUM,
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
      if (validateOrigin && !this.isValidOrigin(req)) {
        await enhancedSecurityMonitor.logSecurityEvent({
          type: SecurityEventType.BLOCKED_ORIGIN,
          ip,
          userAgent,
          endpoint: req.nextUrl.pathname,
          details: { origin: req.headers.get('origin') },
          severity: EventSeverity.MEDIUM,
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
      if (validateSignature && !this.isValidSignature(req, body)) {
        await enhancedSecurityMonitor.logSecurityEvent({
          type: SecurityEventType.AUTHENTICATION_FAILURE,
          ip,
          userAgent,
          endpoint: req.nextUrl.pathname,
          details: { reason: 'Invalid signature' },
          severity: EventSeverity.HIGH,
        });

        return {
          success: false,
          response: NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          ),
        };
      }

      // 4. Authenticate API key
      let authResult;
      if (requireAuth) {
        authResult = await enhancedApiKeyAuth.authenticate(req, requiredPermission);
        if (!authResult.success) {
          await enhancedSecurityMonitor.logSecurityEvent({
            type: SecurityEventType.INVALID_API_KEY,
            ip,
            userAgent,
            endpoint: req.nextUrl.pathname,
            details: { error: authResult.error },
            severity: EventSeverity.MEDIUM,
          });

          return {
            success: false,
            response: NextResponse.json(
              { error: authResult.error },
              { status: 401 }
            ),
          };
        }
      }

      // 5. Apply rate limiting
      const rateLimiter = this.rateLimiters[rateLimitType];
      const rateLimitResult = await rateLimiter.checkLimit(req);

      if (!rateLimitResult.success) {
        await enhancedSecurityMonitor.logSecurityEvent({
          type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          ip,
          userAgent,
          endpoint: req.nextUrl.pathname,
          details: {
            limit: rateLimitResult.limit,
            retryAfter: rateLimitResult.retryAfter,
          },
          severity: EventSeverity.LOW,
        });

        return {
          success: false,
          response: NextResponse.json(
            { error: 'Rate limit exceeded' },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
                'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
              },
            }
          ),
        };
      }

      // 6. Log usage analytics (async, non-blocking)
      if (logUsage && authResult?.keyInfo) {
        const responseTime = Date.now() - startTime;
        usageAnalytics.logRequest({
          endpoint: req.nextUrl.pathname,
          method: req.method,
          statusCode: 200, // Will be updated later if needed
          responseTime,
          requestSize: body?.length,
          ip,
          userAgent,
          apiKeyId: authResult.keyInfo.id,
          userId: authResult.keyInfo.userId,
        }).catch(error => {
          console.error('Failed to log usage:', error);
        });
      }

      // Success
      return {
        success: true,
        metadata: {
          rateLimitRemaining: rateLimitResult.remaining,
          rateLimitReset: rateLimitResult.resetTime,
          keyName: authResult?.keyInfo?.name,
          userId: authResult?.user?.id,
        },
      };
    } catch (error) {
      console.error('Security middleware error:', error);
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Internal security error' },
          { status: 500 }
        ),
      };
    }
  }

  /**
   * Validate request origin
   */
  private isValidOrigin(req: NextRequest): boolean {
    const origin = req.headers.get('origin');
    if (!origin) return true; // Allow requests without origin (e.g., server-to-server)

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    return allowedOrigins.some(allowed => 
      allowed.trim() === origin || allowed.trim() === '*'
    );
  }

  /**
   * Validate request signature
   */
  private isValidSignature(req: NextRequest, body?: string): boolean {
    const signature = req.headers.get('x-signature');
    const timestamp = req.headers.get('x-timestamp');
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (!signature || !timestamp || !webhookSecret) {
      return false;
    }

    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(`${timestamp}.${body || ''}`)
        .digest('hex');

      return signature === `sha256=${expectedSignature}`;
    } catch (error) {
      console.error('Signature validation error:', error);
      return false;
    }
  }

  /**
   * Create success response with security headers
   */
  createSuccessResponse(data: any, metadata?: any): NextResponse {
    const response = NextResponse.json({ ...data, success: true });

    // Add security headers
    this.addSecurityHeaders(response);

    // Add rate limit headers if available
    if (metadata?.rateLimitRemaining !== undefined) {
      response.headers.set('X-RateLimit-Remaining', metadata.rateLimitRemaining.toString());
    }
    if (metadata?.rateLimitReset) {
      response.headers.set('X-RateLimit-Reset', metadata.rateLimitReset.toString());
    }

    return response;
  }

  /**
   * Create error response with security headers
   */
  createErrorResponse(message: string, status: number = 400): NextResponse {
    const response = NextResponse.json({ error: message, success: false }, { status });
    this.addSecurityHeaders(response);
    return response;
  }

  /**
   * Add security headers to response
   */
  private addSecurityHeaders(response: NextResponse): void {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }

  /**
   * Handle CORS preflight requests
   */
  handleCORS(): NextResponse {
    const response = new NextResponse(null, { status: 200 });
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, x-signature, x-timestamp');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    this.addSecurityHeaders(response);
    return response;
  }
}

// Export singleton instance
export const enhancedSecurityMiddleware = new EnhancedSecurityMiddleware();

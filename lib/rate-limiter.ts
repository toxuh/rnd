import { NextRequest } from "next/server";

import { getRedisClient } from "./redis";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private redis = getRedisClient();

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req) => this.getClientIP(req),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };
  }

  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIP = req.headers.get("x-real-ip");
    const cfConnectingIP = req.headers.get("cf-connecting-ip");

    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    if (realIP) {
      return realIP;
    }

    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    return "unknown";
  }

  async checkLimit(req: NextRequest): Promise<RateLimitResult> {
    const key = `rate_limit:${this.config.keyGenerator!(req)}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();

      // Remove expired entries
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Count current requests in window
      pipeline.zcard(key);

      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);

      // Set expiration
      pipeline.expire(key, Math.ceil(this.config.windowMs / 1000));

      const results = await pipeline.exec();

      if (!results) {
        throw new Error("Redis pipeline execution failed");
      }

      const currentCount = (results[1][1] as number) || 0;
      const remaining = Math.max(0, this.config.maxRequests - currentCount - 1);
      const resetTime = now + this.config.windowMs;

      if (currentCount >= this.config.maxRequests) {
        // Remove the request we just added since it's over the limit
        await this.redis.zrem(key, `${now}-${Math.random()}`);

        return {
          success: false,
          limit: this.config.maxRequests,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil(this.config.windowMs / 1000),
        };
      }

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error("Rate limiter error:", error);
      // Fail open - allow request if Redis is down
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }
  }

  async reset(req: NextRequest): Promise<void> {
    const key = `rate_limit:${this.config.keyGenerator!(req)}`;
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error("Rate limiter reset error:", error);
    }
  }
}

// Pre-configured rate limiters for different endpoints
export const createRateLimiters = () => {
  const globalLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || "100"),
  });

  const randomLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_RANDOM_MAX || "30"),
    keyGenerator: (req) => {
      const ip = new RateLimiter({ windowMs: 0, maxRequests: 0 })[
        "getClientIP"
      ](req);
      const endpoint = req.nextUrl.pathname;
      return `${ip}:${endpoint}`;
    },
  });

  const strictLimiter = new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_STRICT_MAX || "10"),
  });

  return {
    global: globalLimiter,
    random: randomLimiter,
    strict: strictLimiter,
  };
};

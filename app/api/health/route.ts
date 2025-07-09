import { NextRequest } from 'next/server';
import { ErrorHandler, withErrorHandler } from '@/lib/error-handler';
import { checkRedisHealth } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { env, getDatabaseInfo, getRedisInfo, isESP32Available } from '@/lib/env-validation';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
      info: {
        host: string;
        database: string;
      };
    };
    redis: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
      info: {
        host: string;
        port: number;
      };
    };
    esp32?: {
      status: 'up' | 'down' | 'not_configured';
      latency?: number;
      error?: string;
      url?: string;
    };
  };
  features: {
    apiKeyAuth: boolean;
    esp32Integration: boolean;
    rateLimiting: boolean;
  };
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<{
  status: 'up' | 'down';
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return { status: 'up', latency };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check ESP32 health
 */
async function checkESP32Health(): Promise<{
  status: 'up' | 'down' | 'not_configured';
  latency?: number;
  error?: string;
}> {
  if (!isESP32Available()) {
    return { status: 'not_configured' };
  }

  try {
    const start = Date.now();
    const response = await fetch(`${env.RND_SERVER_URL}/health`, {
      method: 'GET',
      timeout: 5000, // 5 second timeout
    });
    const latency = Date.now() - start;

    if (response.ok) {
      return { status: 'up', latency };
    } else {
      return {
        status: 'down',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Determine overall health status
 */
function determineOverallStatus(
  database: { status: string },
  redis: { status: string },
  esp32?: { status: string }
): 'healthy' | 'degraded' | 'unhealthy' {
  // Critical services: database and redis
  if (database.status === 'down' || redis.status === 'down') {
    return 'unhealthy';
  }

  // ESP32 is optional, but if configured and down, it's degraded
  if (esp32 && esp32.status === 'down') {
    return 'degraded';
  }

  return 'healthy';
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const timestamp = new Date().toISOString();

  // Check all services in parallel
  const [databaseHealth, redisHealth, esp32Health] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkESP32Health(),
  ]);

  // Determine overall status
  const overallStatus = determineOverallStatus(
    databaseHealth,
    redisHealth,
    esp32Health
  );

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp,
    version: process.env.npm_package_version || '1.0.0',
    environment: env.NODE_ENV,
    services: {
      database: {
        ...databaseHealth,
        info: getDatabaseInfo(),
      },
      redis: {
        ...redisHealth,
        info: getRedisInfo(),
      },
    },
    features: {
      apiKeyAuth: !env.DISABLE_API_KEY_AUTH,
      esp32Integration: isESP32Available(),
      rateLimiting: true,
    },
  };

  // Add ESP32 status if configured
  if (isESP32Available()) {
    healthStatus.services.esp32 = {
      ...esp32Health,
      url: env.RND_SERVER_URL,
    };
  }

  // Return appropriate HTTP status code
  const httpStatus = overallStatus === 'healthy' ? 200 : 
                    overallStatus === 'degraded' ? 200 : 503;

  return ErrorHandler.createSuccessResponse(healthStatus, undefined, httpStatus);
});

// Also support HEAD requests for simple health checks
export const HEAD = withErrorHandler(async (req: NextRequest) => {
  const [databaseHealth, redisHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);

  const overallStatus = determineOverallStatus(databaseHealth, redisHealth);
  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

  return new Response(null, { status: httpStatus });
});

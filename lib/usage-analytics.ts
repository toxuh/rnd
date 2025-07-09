import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

export interface UsageMetrics {
  totalRequests: number;
  requestsByEndpoint: Record<string, number>;
  requestsByStatus: Record<string, number>;
  averageResponseTime: number;
  requestsOverTime: Array<{
    date: string;
    count: number;
  }>;
  topApiKeys: Array<{
    name: string;
    requests: number;
  }>;
  errorRate: number;
}

export interface RequestLogData {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize?: number;
  responseSize?: number;
  ip: string;
  userAgent?: string;
  apiKeyId?: string;
  userId?: string;
}

export class UsageAnalytics {
  /**
   * Log a request for analytics
   */
  async logRequest(data: RequestLogData): Promise<void> {
    try {
      // Log to usage_records table
      await prisma.usageRecord.create({
        data: {
          endpoint: data.endpoint,
          method: data.method,
          statusCode: data.statusCode,
          responseTime: data.responseTime,
          requestSize: data.requestSize,
          responseSize: data.responseSize,
          ip: data.ip,
          userAgent: data.userAgent,
          apiKeyId: data.apiKeyId,
          userId: data.userId,
        },
      });
    } catch (error) {
      console.error('Failed to log usage record:', error);
    }
  }

  /**
   * Log detailed request history (optional, for debugging)
   */
  async logRequestHistory(
    req: NextRequest,
    response: NextResponse,
    responseTime: number,
    apiKeyId?: string
  ): Promise<void> {
    try {
      const requestBody = await this.safeGetRequestBody(req);
      const responseBody = await this.safeGetResponseBody(response);

      await prisma.requestHistory.create({
        data: {
          endpoint: req.nextUrl.pathname,
          method: req.method,
          headers: this.sanitizeHeaders(req.headers),
          body: requestBody,
          response: responseBody,
          statusCode: response.status,
          responseTime,
          ip: this.getClientIP(req),
          userAgent: req.headers.get('user-agent'),
          apiKeyId,
        },
      });
    } catch (error) {
      console.error('Failed to log request history:', error);
    }
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfConnectingIP = req.headers.get('cf-connecting-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    return 'unknown';
  }

  /**
   * Safely get request body
   */
  private async safeGetRequestBody(req: NextRequest): Promise<any> {
    try {
      const body = await req.text();
      return body ? JSON.parse(body) : null;
    } catch {
      return null;
    }
  }

  /**
   * Safely get response body
   */
  private async safeGetResponseBody(response: NextResponse): Promise<any> {
    try {
      // This is tricky with NextResponse, might need to be handled differently
      return null; // For now, skip response body logging
    } catch {
      return null;
    }
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: Headers): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveHeaders = ['x-api-key', 'authorization', 'cookie'];

    headers.forEach((value, key) => {
      if (!sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Get usage metrics for a time period
   */
  async getUsageMetrics(
    timeRange: number = 24 * 60 * 60 * 1000, // 24 hours default
    apiKeyId?: string
  ): Promise<UsageMetrics> {
    try {
      const since = new Date(Date.now() - timeRange);

      const whereClause = {
        createdAt: { gte: since },
        ...(apiKeyId && { apiKeyId }),
      };

      // Get usage records
      const records = await prisma.usageRecord.findMany({
        where: whereClause,
        include: {
          apiKey: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate metrics
      const totalRequests = records.length;
      const requestsByEndpoint: Record<string, number> = {};
      const requestsByStatus: Record<string, number> = {};
      const apiKeyRequests: Record<string, number> = {};
      let totalResponseTime = 0;
      let errorCount = 0;

      records.forEach(record => {
        // Endpoint stats
        requestsByEndpoint[record.endpoint] = (requestsByEndpoint[record.endpoint] || 0) + 1;
        
        // Status code stats
        const statusGroup = `${Math.floor(record.statusCode / 100)}xx`;
        requestsByStatus[statusGroup] = (requestsByStatus[statusGroup] || 0) + 1;
        
        // API key stats
        if (record.apiKey?.name) {
          apiKeyRequests[record.apiKey.name] = (apiKeyRequests[record.apiKey.name] || 0) + 1;
        }
        
        // Response time
        totalResponseTime += record.responseTime;
        
        // Error count
        if (record.statusCode >= 400) {
          errorCount++;
        }
      });

      // Requests over time (daily buckets)
      const requestsOverTime = await this.getRequestsOverTime(since, apiKeyId);

      // Top API keys
      const topApiKeys = Object.entries(apiKeyRequests)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, requests]) => ({ name, requests }));

      return {
        totalRequests,
        requestsByEndpoint,
        requestsByStatus,
        averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
        requestsOverTime,
        topApiKeys,
        errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
      };
    } catch (error) {
      console.error('Failed to get usage metrics:', error);
      return {
        totalRequests: 0,
        requestsByEndpoint: {},
        requestsByStatus: {},
        averageResponseTime: 0,
        requestsOverTime: [],
        topApiKeys: [],
        errorRate: 0,
      };
    }
  }

  /**
   * Get requests over time (daily buckets)
   */
  private async getRequestsOverTime(
    since: Date,
    apiKeyId?: string
  ): Promise<Array<{ date: string; count: number }>> {
    try {
      const result = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM usage_records 
        WHERE created_at >= ${since}
        ${apiKeyId ? prisma.$queryRaw`AND api_key_id = ${apiKeyId}` : prisma.$queryRaw``}
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

  /**
   * Get API key usage statistics
   */
  async getApiKeyStats(apiKeyId: string, timeRange: number = 24 * 60 * 60 * 1000): Promise<{
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    requestsByEndpoint: Record<string, number>;
    recentRequests: Array<{
      endpoint: string;
      statusCode: number;
      responseTime: number;
      createdAt: Date;
    }>;
  }> {
    try {
      const since = new Date(Date.now() - timeRange);

      const records = await prisma.usageRecord.findMany({
        where: {
          apiKeyId,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const totalRequests = records.length;
      const successCount = records.filter(r => r.statusCode < 400).length;
      const totalResponseTime = records.reduce((sum, r) => sum + r.responseTime, 0);
      
      const requestsByEndpoint: Record<string, number> = {};
      records.forEach(record => {
        requestsByEndpoint[record.endpoint] = (requestsByEndpoint[record.endpoint] || 0) + 1;
      });

      return {
        totalRequests,
        successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
        averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
        requestsByEndpoint,
        recentRequests: records.slice(0, 20).map(record => ({
          endpoint: record.endpoint,
          statusCode: record.statusCode,
          responseTime: record.responseTime,
          createdAt: record.createdAt,
        })),
      };
    } catch (error) {
      console.error('Failed to get API key stats:', error);
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        requestsByEndpoint: {},
        recentRequests: [],
      };
    }
  }

  /**
   * Clean up old records (for maintenance)
   */
  async cleanupOldRecords(retentionDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const result = await prisma.usageRecord.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`Cleaned up ${result.count} old usage records`);
      return result.count;
    } catch (error) {
      console.error('Failed to cleanup old records:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const usageAnalytics = new UsageAnalytics();

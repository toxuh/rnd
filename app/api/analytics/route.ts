"use server";
import { NextRequest } from "next/server";
import { enhancedSecurityMiddleware } from "@/lib/enhanced-security-middleware";
import { usageAnalytics } from "@/lib/usage-analytics";

export const OPTIONS = async () => {
  return enhancedSecurityMiddleware.handleCORS();
};

export const GET = async (req: NextRequest) => {
  try {
    const securityResult = await enhancedSecurityMiddleware.validateRequest(req, {
      requireAuth: true,
      requiredPermission: "analytics:read",
      rateLimitType: "strict",
      validateOrigin: process.env.NODE_ENV === "production",
    });

    if (!securityResult.success) {
      return securityResult.response!;
    }

    // Get query parameters
    const { searchParams } = req.nextUrl;
    const timeRange = parseInt(searchParams.get('timeRange') || '86400000'); // 24 hours default
    const apiKeyId = searchParams.get('apiKeyId') || undefined;

    // Get usage metrics
    const metrics = await usageAnalytics.getUsageMetrics(timeRange, apiKeyId);

    // Transform data to match dashboard expectations
    const transformedData = {
      totalRequests: metrics.totalRequests,
      requestsToday: metrics.totalRequests, // For now, use total as today
      requestsThisWeek: metrics.totalRequests,
      requestsThisMonth: metrics.totalRequests,
      averageResponseTime: Math.round(metrics.averageResponseTime),

      // Transform endpoints data
      topEndpoints: Object.entries(metrics.requestsByEndpoint)
        .map(([endpoint, count]) => ({
          endpoint,
          count: count as number,
          percentage: metrics.totalRequests > 0 ? ((count as number) / metrics.totalRequests) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),

      // Transform time series data
      requestsByHour: [], // TODO: Implement hourly data
      requestsByDay: metrics.requestsOverTime,

      // Transform API key usage
      apiKeyUsage: metrics.topApiKeys.map(key => ({
        keyId: 'unknown', // TODO: Get actual key ID
        keyName: key.name,
        requests: key.requests,
        lastUsed: new Date().toISOString(), // TODO: Get actual last used
      })),
    };

    return enhancedSecurityMiddleware.createSuccessResponse(
      {
        data: transformedData,
        timeRange,
        generatedAt: new Date().toISOString(),
      },
      securityResult.metadata
    );
  } catch (error) {
    console.error("Analytics API error:", error);
    return enhancedSecurityMiddleware.createErrorResponse(
      "Failed to fetch analytics",
      500
    );
  }
};

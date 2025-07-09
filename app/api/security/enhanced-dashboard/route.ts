"use server";
import { NextRequest } from "next/server";

import { enhancedSecurityMiddleware } from "@/infrastructure/middleware/enhanced-security-middleware";
import { enhancedSecurityMonitor } from "@/infrastructure/external/enhanced-security-monitor";

export const OPTIONS = async () => {
  return enhancedSecurityMiddleware.handleCORS();
};

export const GET = async (req: NextRequest) => {
  try {
    const securityResult = await enhancedSecurityMiddleware.validateRequest(req, {
      requireAuth: true,
      requiredPermission: "*",
      rateLimitType: "strict",
      validateOrigin: true,
    });

    if (!securityResult.success) {
      return securityResult.response!;
    }

    // Get query parameters
    const { searchParams } = req.nextUrl;
    const timeRange = parseInt(searchParams.get('timeRange') || '86400000'); // 24 hours default

    const stats = await enhancedSecurityMonitor.getSecurityStats(timeRange);

    const dashboard = {
      timestamp: new Date().toISOString(),
      timeRange,
      stats,
      summary: {
        totalEvents: stats.totalEvents,
        eventTypes: Object.keys(stats.eventsByType).length,
        topEventType: Object.entries(stats.eventsByType)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || "none",
        criticalEvents: stats.eventsBySeverity.CRITICAL || 0,
        highSeverityEvents: stats.eventsBySeverity.HIGH || 0,
      },
      topIPs: stats.topIPs,
      recentEvents: stats.recentEvents,
      status: "operational",
    };

    return enhancedSecurityMiddleware.createSuccessResponse(
      dashboard,
      securityResult.metadata,
    );
  } catch (error) {
    console.error("Enhanced security dashboard error:", error);
    return enhancedSecurityMiddleware.createErrorResponse("Failed to fetch dashboard", 500);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.text();
    let parsedBody;

    try {
      parsedBody = JSON.parse(body);
    } catch {
      return enhancedSecurityMiddleware.createErrorResponse(
        "Invalid JSON in request body",
        400,
      );
    }

    const securityResult = await enhancedSecurityMiddleware.validateRequest(
      req,
      {
        requireAuth: true,
        requiredPermission: "*", // Admin only
        rateLimitType: "strict",
        validateOrigin: true,
      },
      body,
    );

    if (!securityResult.success) {
      return securityResult.response!;
    }

    const { action, ip } = parsedBody;

    if (!action || !ip) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "Action and IP are required",
        400,
      );
    }

    let result;
    switch (action) {
      case "block":
        const duration = parsedBody.duration || 3600;
        await enhancedSecurityMonitor.blockIP(ip, duration);
        result = { message: `IP ${ip} blocked for ${duration} seconds` };
        break;

      case "unblock":
        await enhancedSecurityMonitor.unblockIP(ip);
        result = { message: `IP ${ip} unblocked` };
        break;

      case "check":
        const isBlocked = await enhancedSecurityMonitor.isIPBlocked(ip);
        const stats = await enhancedSecurityMonitor.getSecurityStats();
        const ipEvents = stats.recentEvents.filter(event => event.ip === ip);
        result = { 
          ip, 
          isBlocked, 
          recentEvents: ipEvents.slice(0, 10),
          eventCount: ipEvents.length 
        };
        break;

      default:
        return enhancedSecurityMiddleware.createErrorResponse("Unknown action", 400);
    }

    return enhancedSecurityMiddleware.createSuccessResponse(
      result,
      securityResult.metadata,
    );
  } catch (error) {
    console.error("Enhanced security dashboard action error:", error);
    return enhancedSecurityMiddleware.createErrorResponse("Internal server error", 500);
  }
};

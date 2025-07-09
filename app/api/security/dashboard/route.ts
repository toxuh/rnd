"use server";
import { NextRequest } from "next/server";
import { securityMiddleware } from "@/lib/security-middleware";
import { securityMonitor } from "@/lib/security-monitor";

export const GET = async (req: NextRequest) => {
  try {
    const securityResult = await securityMiddleware.validateRequest(req, {
      requireAuth: true,
      requiredPermission: "*",
      rateLimitType: "strict",
      validateOrigin: true,
    });

    if (!securityResult.success) {
      return securityResult.response!;
    }

    const stats = await securityMonitor.getSecurityStats();

    const dashboard = {
      timestamp: new Date().toISOString(),
      stats,
      summary: {
        totalEvents: Object.values(stats).reduce(
          (sum, count) => sum + count,
          0,
        ),
        eventTypes: Object.keys(stats).length,
        topEventType:
          Object.entries(stats).sort(([, a], [, b]) => b - a)[0]?.[0] || "none",
      },
      status: "operational",
    };

    return securityMiddleware.createSuccessResponse(
      dashboard,
      securityResult.metadata,
    );
  } catch (error) {
    console.error("Error in security dashboard:", error);
    return securityMiddleware.createErrorResponse("Internal server error", 500);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.text();
    let parsedBody;

    try {
      parsedBody = JSON.parse(body);
    } catch {
      return securityMiddleware.createErrorResponse(
        "Invalid JSON in request body",
        400,
      );
    }

    const securityResult = await securityMiddleware.validateRequest(
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
      return securityMiddleware.createErrorResponse(
        "Action and IP are required",
        400,
      );
    }

    let result;
    switch (action) {
      case "block":
        const duration = parsedBody.duration || 3600;
        await securityMonitor.blockIP(ip, duration);
        result = { message: `IP ${ip} blocked for ${duration} seconds` };
        break;

      case "unblock":
        await securityMonitor.unblockIP(ip);
        result = { message: `IP ${ip} unblocked` };
        break;

      case "check":
        const isBlocked = await securityMonitor.isIPBlocked(ip);
        const ipStats = await securityMonitor.getSecurityStats(ip);
        result = { ip, isBlocked, stats: ipStats };
        break;

      default:
        return securityMiddleware.createErrorResponse("Unknown action", 400);
    }

    return securityMiddleware.createSuccessResponse(
      result,
      securityResult.metadata,
    );
  } catch (error) {
    console.error("Error in security dashboard action:", error);
    return securityMiddleware.createErrorResponse("Internal server error", 500);
  }
};

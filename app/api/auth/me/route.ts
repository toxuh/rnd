"use server";
import { NextRequest } from "next/server";
import { authService } from "@/lib/auth-service";
import { enhancedSecurityMiddleware } from "@/lib/enhanced-security-middleware";

export const OPTIONS = async () => {
  return enhancedSecurityMiddleware.handleCORS();
};

export const GET = async (req: NextRequest) => {
  try {
    // Basic security validation (no API key required, but check for auth token)
    const securityResult = await enhancedSecurityMiddleware.validateRequest(req, {
      requireAuth: false,
      rateLimitType: "global",
      validateOrigin: process.env.NODE_ENV === "production",
    });

    if (!securityResult.success) {
      return securityResult.response!;
    }

    // Get user from request (cookie or Authorization header)
    const user = await authService.getUserFromRequest(req);

    if (!user) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "Not authenticated",
        401
      );
    }

    return enhancedSecurityMiddleware.createSuccessResponse({
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return enhancedSecurityMiddleware.createErrorResponse(
      "Internal server error",
      500
    );
  }
};

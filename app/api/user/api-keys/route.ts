"use server";
import { NextRequest } from "next/server";
import { authService } from "@/lib/auth-service";
import { userApiKeyService } from "@/lib/user-api-key-service";
import { enhancedSecurityMiddleware } from "@/lib/enhanced-security-middleware";

export const OPTIONS = async () => {
  return enhancedSecurityMiddleware.handleCORS();
};

// Get user's API keys
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

    // Get user from request
    const user = await authService.getUserFromRequest(req);
    if (!user) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "Authentication required",
        401
      );
    }

    // Get user's API keys
    const apiKeys = await userApiKeyService.getUserApiKeys(user.id);

    return enhancedSecurityMiddleware.createSuccessResponse({
      apiKeys,
    });
  } catch (error) {
    console.error("Get API keys error:", error);
    return enhancedSecurityMiddleware.createErrorResponse(
      "Internal server error",
      500
    );
  }
};

// Create new API key
export const POST = async (req: NextRequest) => {
  try {
    const body = await req.text();
    let parsedBody;

    try {
      parsedBody = JSON.parse(body);
    } catch {
      return enhancedSecurityMiddleware.createErrorResponse(
        "Invalid JSON in request body",
        400
      );
    }

    // Basic security validation
    const securityResult = await enhancedSecurityMiddleware.validateRequest(req, {
      requireAuth: false,
      rateLimitType: "strict",
      validateOrigin: process.env.NODE_ENV === "production",
      maxBodySize: 1024, // 1KB for API key creation
    }, body);

    if (!securityResult.success) {
      return securityResult.response!;
    }

    // Get user from request
    const user = await authService.getUserFromRequest(req);
    if (!user) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "Authentication required",
        401
      );
    }

    const { name, rateLimit, expiresAt } = parsedBody;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "API key name is required",
        400
      );
    }

    if (name.length > 50) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "API key name must be 50 characters or less",
        400
      );
    }

    // Validate rate limit if provided
    if (rateLimit !== undefined && (typeof rateLimit !== 'number' || rateLimit < 1 || rateLimit > 1000)) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "Rate limit must be between 1 and 1000 requests per minute",
        400
      );
    }

    // Validate expiration date if provided
    let expirationDate: Date | undefined;
    if (expiresAt) {
      expirationDate = new Date(expiresAt);
      if (isNaN(expirationDate.getTime()) || expirationDate <= new Date()) {
        return enhancedSecurityMiddleware.createErrorResponse(
          "Expiration date must be a valid future date",
          400
        );
      }
    }

    // Create API key
    const result = await userApiKeyService.createApiKey(user.id, {
      name: name.trim(),
      rateLimit,
      expiresAt: expirationDate,
    });

    if (!result.success) {
      return enhancedSecurityMiddleware.createErrorResponse(
        result.error || "Failed to create API key",
        400
      );
    }

    return enhancedSecurityMiddleware.createSuccessResponse({
      message: "API key created successfully",
      apiKey: result.apiKey,
      key: result.key, // Only returned once during creation
    });
  } catch (error) {
    console.error("Create API key error:", error);
    return enhancedSecurityMiddleware.createErrorResponse(
      "Internal server error",
      500
    );
  }
};

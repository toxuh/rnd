"use server";
import { NextRequest } from "next/server";
import { authService } from "@/core/services/auth-service";
import { userApiKeyService } from "@/core/services/user-api-key-service";
import { enhancedSecurityMiddleware } from "@/infrastructure/middleware/enhanced-security-middleware";

export const OPTIONS = async () => {
  return enhancedSecurityMiddleware.handleCORS();
};

// Update API key
export const PUT = async (req: NextRequest, { params }: { params: { keyId: string } }) => {
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
      maxBodySize: 1024,
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

    const { keyId } = params;
    const { name, rateLimit, isActive } = parsedBody;

    // Validate inputs
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0 || name.length > 50)) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "API key name must be between 1 and 50 characters",
        400
      );
    }

    if (rateLimit !== undefined && (typeof rateLimit !== 'number' || rateLimit < 1 || rateLimit > 1000)) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "Rate limit must be between 1 and 1000 requests per minute",
        400
      );
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return enhancedSecurityMiddleware.createErrorResponse(
        "isActive must be a boolean",
        400
      );
    }

    // Update API key
    const result = await userApiKeyService.updateApiKey(user.id, keyId, {
      ...(name !== undefined && { name: name.trim() }),
      ...(rateLimit !== undefined && { rateLimit }),
      ...(isActive !== undefined && { isActive }),
    });

    if (!result.success) {
      return enhancedSecurityMiddleware.createErrorResponse(
        result.error || "Failed to update API key",
        400
      );
    }

    return enhancedSecurityMiddleware.createSuccessResponse({
      message: "API key updated successfully",
      apiKey: result.apiKey,
    });
  } catch (error) {
    console.error("Update API key error:", error);
    return enhancedSecurityMiddleware.createErrorResponse(
      "Internal server error",
      500
    );
  }
};

// Delete API key
export const DELETE = async (req: NextRequest, { params }: { params: { keyId: string } }) => {
  try {
    // Basic security validation
    const securityResult = await enhancedSecurityMiddleware.validateRequest(req, {
      requireAuth: false,
      rateLimitType: "strict",
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

    const { keyId } = params;

    // Delete API key
    const result = await userApiKeyService.deleteApiKey(user.id, keyId);

    if (!result.success) {
      return enhancedSecurityMiddleware.createErrorResponse(
        result.error || "Failed to delete API key",
        400
      );
    }

    return enhancedSecurityMiddleware.createSuccessResponse({
      message: "API key deleted successfully",
    });
  } catch (error) {
    console.error("Delete API key error:", error);
    return enhancedSecurityMiddleware.createErrorResponse(
      "Internal server error",
      500
    );
  }
};

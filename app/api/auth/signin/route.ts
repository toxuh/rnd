"use server";
import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth-service";
import { enhancedSecurityMiddleware } from "@/lib/enhanced-security-middleware";

export const OPTIONS = async () => {
  return enhancedSecurityMiddleware.handleCORS();
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
        400
      );
    }

    // Basic security validation (no API key required for signin)
    const securityResult = await enhancedSecurityMiddleware.validateRequest(req, {
      requireAuth: false,
      rateLimitType: "strict",
      validateOrigin: process.env.NODE_ENV === "production",
      maxBodySize: 1024, // 1KB for signin
    }, body);

    if (!securityResult.success) {
      return securityResult.response!;
    }

    const { email, password } = parsedBody;

    if (!email || !password) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "Email and password are required",
        400
      );
    }

    // Sign in user
    const result = await authService.signIn({
      email,
      password,
    });

    if (!result.success) {
      return enhancedSecurityMiddleware.createErrorResponse(
        result.error || "Failed to sign in",
        401
      );
    }

    // Set HTTP-only cookie
    const response = enhancedSecurityMiddleware.createSuccessResponse({
      user: result.user,
      message: "Signed in successfully",
    });

    response.cookies.set("auth-token", result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signin error:", error);
    return enhancedSecurityMiddleware.createErrorResponse(
      "Internal server error",
      500
    );
  }
};

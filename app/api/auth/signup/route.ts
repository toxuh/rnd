"use server";
import { NextRequest } from "next/server";
import { authService } from "@/lib/auth-service";
import { enhancedSecurityMiddleware } from "@/lib/enhanced-security-middleware";
import { ErrorHandler, withErrorHandler, validateRequest } from "@/lib/error-handler";
import { signUpSchema } from "@/lib/validation-schemas";

export const OPTIONS = async () => {
  return enhancedSecurityMiddleware.handleCORS();
};

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.text();

  // Parse and validate request body
  const parsedBody = JSON.parse(body);
  const validatedData = validateRequest(signUpSchema, parsedBody);

  // Security validation (no API key required for signup)
  const securityResult = await enhancedSecurityMiddleware.validateRequest(req, {
    requireAuth: false,
    rateLimitType: "strict",
    validateOrigin: process.env.NODE_ENV === "production",
    maxBodySize: 1024, // 1KB for signup
  }, body);

  if (!securityResult.success) {
    return securityResult.response!;
  }

  // Sign up user
  const result = await authService.signUp(validatedData);

  if (!result.success) {
    return ErrorHandler.createErrorResponse(
      result.error || "Failed to create account",
      400
    );
  }

  // Create success response
  const response = ErrorHandler.createSuccessResponse(
    {
      user: result.user,
    },
    "Account created successfully",
    201
  );

  // Set HTTP-only cookie
  response.cookies.set("auth-token", result.token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return response;
});

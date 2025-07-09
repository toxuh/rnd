"use server";
import { NextRequest, NextResponse } from "next/server";
import { enhancedSecurityMiddleware } from "@/infrastructure/middleware/enhanced-security-middleware";

export const OPTIONS = async () => {
  return enhancedSecurityMiddleware.handleCORS();
};

export const POST = async (req: NextRequest) => {
  try {
    // Create response that clears the auth cookie
    const response = enhancedSecurityMiddleware.createSuccessResponse({
      message: "Signed out successfully",
    });

    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signout error:", error);
    return enhancedSecurityMiddleware.createErrorResponse(
      "Internal server error",
      500
    );
  }
};

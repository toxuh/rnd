"use server";
import { NextRequest } from "next/server";
import { enhancedSecurityMiddleware } from "@/lib/enhanced-security-middleware";
import * as rnd from "@/services/rnd.service";

export const OPTIONS = async () => {
  return enhancedSecurityMiddleware.handleCORS();
};

export const POST = async (req: NextRequest, { params }: { params: { name: string } }) => {
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

    // Public endpoint - no API key required, but rate limited
    const securityResult = await enhancedSecurityMiddleware.validateRequest(
      req,
      {
        requireAuth: false, // No API key required for public usage
        rateLimitType: "random", // Still rate limited
        validateOrigin: process.env.NODE_ENV === "production",
        maxBodySize: parseInt(process.env.MAX_REQUEST_SIZE || "10240"),
        logUsage: true, // Log usage but without API key attribution
      },
      body,
    );

    if (!securityResult.success) {
      return securityResult.response!;
    }

    const { min, max, choices, length, from, to, items } = parsedBody;
    const { name } = params;
    let result: unknown;

    switch (name) {
      case "number":
        if (typeof min !== "number" || typeof max !== "number") {
          return enhancedSecurityMiddleware.createErrorResponse(
            "min and max must be numbers",
          );
        }
        result = await rnd.randomNumber(min, max);
        break;

      case "boolean":
        result = await rnd.randomBoolean();
        break;

      case "string":
        if (typeof length !== "number" || length < 0) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "length must be a non-negative number for string generation",
          );
        }
        if (length > 1000) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "string length cannot exceed 1000 characters",
          );
        }
        result = await rnd.randomString(length);
        break;

      case "choice":
        if (!Array.isArray(choices) || choices.length === 0) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "choices must be a non-empty array",
          );
        }
        if (choices.length > 1000) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "choices array cannot exceed 1000 items",
          );
        }
        result = await rnd.randomChoice(choices);
        break;

      case "shuffle":
        if (!Array.isArray(items) || items.length === 0) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "items must be a non-empty array for shuffling",
          );
        }
        if (items.length > 1000) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "items array cannot exceed 1000 items for shuffling",
          );
        }
        result = await rnd.shuffle(items);
        break;

      case "date":
        if (!from || !to) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "from and to dates are required",
          );
        }
        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
          return enhancedSecurityMiddleware.createErrorResponse("Invalid date format");
        }
        const dateResult = await rnd.randomDate(fromDate, toDate);
        result = dateResult.toISOString();
        break;

      case "uuid":
        result = await rnd.randomUUIDv4();
        break;

      case "hex":
        if (typeof length !== "number" || length < 0) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "length must be a non-negative number for hex generation",
          );
        }
        if (length > 1000) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "hex length cannot exceed 1000 characters",
          );
        }
        result = await rnd.randomHex(length);
        break;

      case "password":
        if (typeof length !== "number" || length < 0) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "length must be a non-negative number for password generation",
          );
        }
        if (length > 128) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "password length cannot exceed 128 characters",
          );
        }
        result = await rnd.randomPassword(length);
        break;

      default:
        return enhancedSecurityMiddleware.createErrorResponse("Unknown rnd type");
    }

    if (process.env.ENABLE_REQUEST_LOGGING === "true") {
      console.log(
        `Public RND API: ${name} - Success - IP: ${req.headers.get("x-forwarded-for") || "unknown"}`,
      );
    }

    return enhancedSecurityMiddleware.createSuccessResponse(
      { result },
      securityResult.metadata,
    );
  } catch (error) {
    console.error("Public RND API error:", error);
    return enhancedSecurityMiddleware.createErrorResponse(
      "Failed to generate random data",
      500,
    );
  }
};

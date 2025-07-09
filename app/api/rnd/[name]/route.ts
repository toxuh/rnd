"use server";
import { NextRequest } from "next/server";

import { enhancedSecurityMiddleware } from "@/infrastructure/middleware/enhanced-security-middleware";
import * as rnd from "@/core/services/rnd.service";

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
        400,
      );
    }

    const securityResult = await enhancedSecurityMiddleware.validateRequest(
      req,
      {
        requireAuth: true,
        requiredPermission: "random:read",
        rateLimitType: "random",
        validateOrigin: process.env.NODE_ENV === "production",
        maxBodySize: parseInt(process.env.MAX_REQUEST_SIZE || "10240"),
      },
      body,
    );

    if (!securityResult.success) {
      return securityResult.response!;
    }

    const { min, max, choices, length, from, to, items } = parsedBody;
    const name = req.nextUrl.pathname.split("/").pop();
    let result: unknown;

    switch (name) {
      case "number":
        if (typeof min !== "number" || typeof max !== "number") {
          return enhancedSecurityMiddleware.createErrorResponse(
            "min and max must be numbers for number generation",
          );
        }
        result = await rnd.randomNumber(min, max);
        break;

      case "boolean":
        result = await rnd.randomBoolean();
        break;

      case "float":
        result = await rnd.randomFloat(min, max);
        break;

      case "choice":
        if (!Array.isArray(choices) || choices.length === 0) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "choices must be a non-empty array",
          );
        }
        result = await rnd.randomChoice(choices);
        break;

      case "string":
        if (typeof length !== "number" || length < 0) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "length must be a non-negative number",
          );
        }
        if (length > 1000) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "string length cannot exceed 1000 characters",
          );
        }
        result = await rnd.randomString(length);
        break;

      case "color":
        result = await rnd.randomHexColor();
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

      case "shuffle":
        if (!Array.isArray(choices) || choices.length === 0) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "choices must be a non-empty array for shuffle",
          );
        }
        if (choices.length > 1000) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "array size cannot exceed 1000 items",
          );
        }
        result = await rnd.shuffle(choices);
        break;

      case "weighted":
        if (!Array.isArray(items) || items.length === 0) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "items must be a non-empty array of [value, weight] pairs",
          );
        }
        if (items.length > 100) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "weighted items array cannot exceed 100 items",
          );
        }
        const isValidWeightedItems = items.every(
          (item) =>
            Array.isArray(item) &&
            item.length === 2 &&
            typeof item[1] === "number",
        );
        if (!isValidWeightedItems) {
          return enhancedSecurityMiddleware.createErrorResponse(
            "items must be an array of [value, weight] pairs where weight is a number",
          );
        }
        result = await rnd.weightedChoice(items);
        break;

      case "hsl":
        result = await rnd.randomHslColor();
        break;

      case "gradient":
        result = await rnd.randomGradient();
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
        `RND API: ${name} - Success - IP: ${req.headers.get("x-forwarded-for") || "unknown"}`,
      );
    }

    return enhancedSecurityMiddleware.createSuccessResponse(
      { result },
      securityResult.metadata,
    );
  } catch (error) {
    console.error("Error in RND API:", error);

    if (process.env.ENABLE_REQUEST_LOGGING === "true") {
      console.log(
        `RND API: Error - ${error} - IP: ${req.headers.get("x-forwarded-for") || "unknown"}`,
      );
    }

    return enhancedSecurityMiddleware.createErrorResponse("Internal server error", 500);
  }
};

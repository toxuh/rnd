"use server";
import { NextRequest } from "next/server";
import { enhancedSecurityMiddleware } from "@/lib/enhanced-security-middleware";
import axios from "axios";

export const OPTIONS = async () => {
  return enhancedSecurityMiddleware.handleCORS();
};

export const GET = async (req: NextRequest) => {
  try {
    // Require API key for raw ESP32 access (this is a premium feature)
    const securityResult = await enhancedSecurityMiddleware.validateRequest(req, {
      requireAuth: true,
      requiredPermission: "esp32:raw",
      rateLimitType: "strict", // More restrictive rate limiting for raw access
      validateOrigin: process.env.NODE_ENV === "production",
      logUsage: true,
    });

    if (!securityResult.success) {
      return securityResult.response!;
    }

    // Get raw string from ESP32
    const RND_SERVER_URL = process.env.RND_SERVER_URL;
    if (!RND_SERVER_URL) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "ESP32 server not configured",
        503
      );
    }

    try {
      const response = await axios.get<string>(
        `${RND_SERVER_URL}/get-random-string`,
        {
          timeout: 10000, // 10 second timeout
        }
      );

      const rawString = response.data;

      if (process.env.ENABLE_REQUEST_LOGGING === "true") {
        console.log(
          `ESP32 Raw String API - Success - IP: ${req.headers.get("x-forwarded-for") || "unknown"} - Length: ${rawString.length}`,
        );
      }

      return enhancedSecurityMiddleware.createSuccessResponse(
        {
          rawString,
          length: rawString.length,
          timestamp: new Date().toISOString(),
          source: "ESP32 Hardware",
        },
        securityResult.metadata,
      );
    } catch (error) {
      console.error("Failed to fetch raw string from ESP32:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          return enhancedSecurityMiddleware.createErrorResponse(
            "ESP32 server is currently unavailable",
            503
          );
        }
        if (error.response?.status) {
          return enhancedSecurityMiddleware.createErrorResponse(
            `ESP32 server error: ${error.response.status}`,
            502
          );
        }
      }

      return enhancedSecurityMiddleware.createErrorResponse(
        "Failed to fetch random string from ESP32",
        500
      );
    }
  } catch (error) {
    console.error("ESP32 raw string API error:", error);
    return enhancedSecurityMiddleware.createErrorResponse(
      "Internal server error",
      500
    );
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
        400
      );
    }

    // Require API key for raw ESP32 access
    const securityResult = await enhancedSecurityMiddleware.validateRequest(req, {
      requireAuth: true,
      requiredPermission: "esp32:raw",
      rateLimitType: "strict",
      validateOrigin: process.env.NODE_ENV === "production",
      maxBodySize: 1024, // 1KB for configuration
      logUsage: true,
    }, body);

    if (!securityResult.success) {
      return securityResult.response!;
    }

    const { count = 1, minLength, maxLength } = parsedBody;

    // Validate parameters
    if (typeof count !== "number" || count < 1 || count > 10) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "count must be between 1 and 10",
        400
      );
    }

    if (minLength !== undefined && (typeof minLength !== "number" || minLength < 1)) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "minLength must be a positive number",
        400
      );
    }

    if (maxLength !== undefined && (typeof maxLength !== "number" || maxLength < 1)) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "maxLength must be a positive number",
        400
      );
    }

    if (minLength && maxLength && minLength > maxLength) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "minLength cannot be greater than maxLength",
        400
      );
    }

    // Get multiple raw strings from ESP32
    const RND_SERVER_URL = process.env.RND_SERVER_URL;
    if (!RND_SERVER_URL) {
      return enhancedSecurityMiddleware.createErrorResponse(
        "ESP32 server not configured",
        503
      );
    }

    try {
      const promises = Array(count).fill(null).map(async () => {
        const response = await axios.get<string>(
          `${RND_SERVER_URL}/get-random-string`,
          { timeout: 10000 }
        );
        return response.data;
      });

      const rawStrings = await Promise.all(promises);

      // Filter by length if specified
      let filteredStrings = rawStrings;
      if (minLength || maxLength) {
        filteredStrings = rawStrings.filter(str => {
          const len = str.length;
          return (!minLength || len >= minLength) && (!maxLength || len <= maxLength);
        });
      }

      if (process.env.ENABLE_REQUEST_LOGGING === "true") {
        console.log(
          `ESP32 Raw Strings API - Success - IP: ${req.headers.get("x-forwarded-for") || "unknown"} - Count: ${filteredStrings.length}`,
        );
      }

      return enhancedSecurityMiddleware.createSuccessResponse(
        {
          rawStrings: filteredStrings,
          count: filteredStrings.length,
          requestedCount: count,
          timestamp: new Date().toISOString(),
          source: "ESP32 Hardware",
          filters: {
            ...(minLength && { minLength }),
            ...(maxLength && { maxLength }),
          },
        },
        securityResult.metadata,
      );
    } catch (error) {
      console.error("Failed to fetch raw strings from ESP32:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          return enhancedSecurityMiddleware.createErrorResponse(
            "ESP32 server is currently unavailable",
            503
          );
        }
        if (error.response?.status) {
          return enhancedSecurityMiddleware.createErrorResponse(
            `ESP32 server error: ${error.response.status}`,
            502
          );
        }
      }

      return enhancedSecurityMiddleware.createErrorResponse(
        "Failed to fetch random strings from ESP32",
        500
      );
    }
  } catch (error) {
    console.error("ESP32 raw strings API error:", error);
    return enhancedSecurityMiddleware.createErrorResponse(
      "Internal server error",
      500
    );
  }
};

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Standard API Error Response Format
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
}

/**
 * Standard API Success Response Format
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
}

/**
 * Error types for better categorization
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

/**
 * Custom application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Error Handler Class
 */
export class ErrorHandler {
  /**
   * Handle different types of errors and return appropriate responses
   */
  static handle(error: unknown): NextResponse<ApiErrorResponse> {
    console.error('API Error:', error);

    // Handle custom AppError
    if (error instanceof AppError) {
      return this.createErrorResponse(
        error.message,
        error.statusCode,
        error.type,
        error.details
      );
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const details = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return this.createErrorResponse(
        'Validation failed',
        400,
        ErrorType.VALIDATION,
        details
      );
    }

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(error);
    }

    // Handle generic errors
    if (error instanceof Error) {
      return this.createErrorResponse(
        process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error.message,
        500,
        ErrorType.INTERNAL
      );
    }

    // Handle unknown errors
    return this.createErrorResponse(
      'An unexpected error occurred',
      500,
      ErrorType.INTERNAL
    );
  }

  /**
   * Handle Prisma-specific errors
   */
  private static handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse<ApiErrorResponse> {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = error.meta?.target as string[] | undefined;
        return this.createErrorResponse(
          `A record with this ${field?.[0] || 'value'} already exists`,
          409,
          ErrorType.VALIDATION,
          { field: field?.[0] }
        );

      case 'P2025':
        // Record not found
        return this.createErrorResponse(
          'Record not found',
          404,
          ErrorType.NOT_FOUND
        );

      case 'P2003':
        // Foreign key constraint violation
        return this.createErrorResponse(
          'Invalid reference to related record',
          400,
          ErrorType.VALIDATION
        );

      default:
        return this.createErrorResponse(
          'Database operation failed',
          500,
          ErrorType.DATABASE,
          process.env.NODE_ENV === 'development' ? error : undefined
        );
    }
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(
    message: string,
    statusCode: number = 500,
    type: ErrorType = ErrorType.INTERNAL,
    details?: unknown
  ): NextResponse<ApiErrorResponse> {
    const response: ApiErrorResponse = {
      success: false,
      error: message,
      code: type,
      timestamp: new Date().toISOString(),
    };

    if (details) {
      response.details = details;
    }

    return NextResponse.json(response, { status: statusCode });
  }

  /**
   * Create standardized success response
   */
  static createSuccessResponse<T>(
    data?: T,
    message?: string,
    statusCode: number = 200
  ): NextResponse<ApiSuccessResponse<T>> {
    const response: ApiSuccessResponse<T> = {
      success: true,
      timestamp: new Date().toISOString(),
    };

    if (data !== undefined) {
      response.data = data;
    }

    if (message) {
      response.message = message;
    }

    return NextResponse.json(response, { status: statusCode });
  }
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandler<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ApiErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  };
}

/**
 * Common error factories
 */
export const Errors = {
  validation: (message: string, details?: unknown) => 
    new AppError(message, ErrorType.VALIDATION, 400, undefined, details),

  authentication: (message: string = 'Authentication required') => 
    new AppError(message, ErrorType.AUTHENTICATION, 401),

  authorization: (message: string = 'Insufficient permissions') => 
    new AppError(message, ErrorType.AUTHORIZATION, 403),

  notFound: (resource: string = 'Resource') => 
    new AppError(`${resource} not found`, ErrorType.NOT_FOUND, 404),

  rateLimit: (message: string = 'Rate limit exceeded') => 
    new AppError(message, ErrorType.RATE_LIMIT, 429),

  externalService: (service: string, message?: string) => 
    new AppError(
      message || `${service} service unavailable`, 
      ErrorType.EXTERNAL_SERVICE, 
      503
    ),

  internal: (message: string = 'Internal server error') => 
    new AppError(message, ErrorType.INTERNAL, 500),
};

/**
 * Validation helper
 */
export function validateRequest<T>(schema: any, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error; // Will be handled by ErrorHandler
    }
    throw Errors.validation('Invalid request data');
  }
}

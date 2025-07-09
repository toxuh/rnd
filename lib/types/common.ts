/**
 * Common Types
 * Shared type definitions across the application
 */

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

// Pagination types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface FilterOptions {
  dateRange?: DateRange;
  status?: string[];
  search?: string;
}

// Audit types
export interface AuditInfo {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Environment types
export type Environment = 'development' | 'staging' | 'production' | 'test';

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Status types
export type Status = 'active' | 'inactive' | 'pending' | 'suspended';

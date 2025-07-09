/**
 * User Domain Model
 * Core user business logic and types
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  isActive?: boolean;
  role?: UserRole;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
}

// User validation rules
export const userValidation = {
  email: {
    minLength: 5,
    maxLength: 255,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
  },
} as const;

// User business rules
export const userRules = {
  maxApiKeys: 10,
  defaultRole: UserRole.USER,
  accountLockoutThreshold: 5,
  accountLockoutDuration: 15 * 60 * 1000, // 15 minutes
} as const;

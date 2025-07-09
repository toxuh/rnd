import { z } from 'zod';

/**
 * Authentication Schemas
 */
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().optional(),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * API Key Management Schemas
 */
export const createApiKeySchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
  rateLimit: z.number()
    .int('Rate limit must be an integer')
    .min(1, 'Rate limit must be at least 1')
    .max(1000, 'Rate limit cannot exceed 1000')
    .optional()
    .default(100),
  expiresAt: z.string().datetime().optional(),
});

export const updateApiKeySchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores')
    .optional(),
  rateLimit: z.number()
    .int('Rate limit must be an integer')
    .min(1, 'Rate limit must be at least 1')
    .max(1000, 'Rate limit cannot exceed 1000')
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * Random Generation Schemas
 */
export const randomNumberSchema = z.object({
  min: z.number().int('Min must be an integer'),
  max: z.number().int('Max must be an integer'),
}).refine(data => data.min <= data.max, {
  message: 'Min cannot be greater than max',
  path: ['min'],
});

export const randomFloatSchema = z.object({
  min: z.number().optional().default(0),
  max: z.number().optional().default(1),
}).refine(data => data.min <= data.max, {
  message: 'Min cannot be greater than max',
  path: ['min'],
});

export const randomStringSchema = z.object({
  length: z.number()
    .int('Length must be an integer')
    .min(0, 'Length cannot be negative')
    .max(1000, 'Length cannot exceed 1000 characters'),
});

export const randomChoiceSchema = z.object({
  choices: z.array(z.unknown())
    .min(1, 'At least one choice is required')
    .max(1000, 'Cannot exceed 1000 choices'),
});

export const randomDateSchema = z.object({
  from: z.string().datetime('Invalid from date format'),
  to: z.string().datetime('Invalid to date format'),
}).refine(data => new Date(data.from) <= new Date(data.to), {
  message: 'From date cannot be after to date',
  path: ['from'],
});

export const randomShuffleSchema = z.object({
  choices: z.array(z.unknown())
    .min(1, 'At least one item is required')
    .max(1000, 'Cannot exceed 1000 items'),
});

export const randomWeightedSchema = z.object({
  items: z.array(
    z.tuple([z.unknown(), z.number().positive('Weight must be positive')])
  )
    .min(1, 'At least one item is required')
    .max(100, 'Cannot exceed 100 weighted items'),
});

export const randomPasswordSchema = z.object({
  length: z.number()
    .int('Length must be an integer')
    .min(4, 'Password length must be at least 4')
    .max(128, 'Password length cannot exceed 128 characters'),
});

/**
 * Security Dashboard Schemas
 */
export const securityActionSchema = z.object({
  action: z.enum(['block', 'unblock', 'check'], {
    errorMap: () => ({ message: 'Action must be block, unblock, or check' }),
  }),
  ip: z.string().ip('Invalid IP address'),
  duration: z.number()
    .int('Duration must be an integer')
    .min(60, 'Duration must be at least 60 seconds')
    .max(86400, 'Duration cannot exceed 24 hours')
    .optional(),
});

/**
 * Analytics Schemas
 */
export const analyticsQuerySchema = z.object({
  timeRange: z.number()
    .int('Time range must be an integer')
    .min(3600000, 'Time range must be at least 1 hour') // 1 hour in ms
    .max(2592000000, 'Time range cannot exceed 30 days') // 30 days in ms
    .optional()
    .default(86400000), // 24 hours default
  apiKeyId: z.string().cuid('Invalid API key ID').optional(),
});

/**
 * ESP32 Raw String Schemas
 */
export const esp32RawStringSchema = z.object({
  count: z.number()
    .int('Count must be an integer')
    .min(1, 'Count must be at least 1')
    .max(10, 'Count cannot exceed 10')
    .optional()
    .default(1),
  minLength: z.number()
    .int('Min length must be an integer')
    .min(10, 'Min length must be at least 10')
    .optional(),
  maxLength: z.number()
    .int('Max length must be an integer')
    .max(1000, 'Max length cannot exceed 1000')
    .optional(),
}).refine(data => {
  if (data.minLength && data.maxLength) {
    return data.minLength <= data.maxLength;
  }
  return true;
}, {
  message: 'Min length cannot be greater than max length',
  path: ['minLength'],
});

/**
 * Common parameter schemas
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Type exports for TypeScript
 */
export type SignUpRequest = z.infer<typeof signUpSchema>;
export type SignInRequest = z.infer<typeof signInSchema>;
export type CreateApiKeyRequest = z.infer<typeof createApiKeySchema>;
export type UpdateApiKeyRequest = z.infer<typeof updateApiKeySchema>;
export type RandomNumberRequest = z.infer<typeof randomNumberSchema>;
export type RandomFloatRequest = z.infer<typeof randomFloatSchema>;
export type RandomStringRequest = z.infer<typeof randomStringSchema>;
export type RandomChoiceRequest = z.infer<typeof randomChoiceSchema>;
export type RandomDateRequest = z.infer<typeof randomDateSchema>;
export type RandomShuffleRequest = z.infer<typeof randomShuffleSchema>;
export type RandomWeightedRequest = z.infer<typeof randomWeightedSchema>;
export type RandomPasswordRequest = z.infer<typeof randomPasswordSchema>;
export type SecurityActionRequest = z.infer<typeof securityActionSchema>;
export type AnalyticsQueryRequest = z.infer<typeof analyticsQuerySchema>;
export type ESP32RawStringRequest = z.infer<typeof esp32RawStringSchema>;

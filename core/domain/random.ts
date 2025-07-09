/**
 * Random Generation Domain Model
 * Core random generation business logic and types
 */

export type RndType = 
  | 'number' 
  | 'boolean' 
  | 'float' 
  | 'choice' 
  | 'string' 
  | 'color' 
  | 'date' 
  | 'uuid' 
  | 'shuffle' 
  | 'weighted-choice' 
  | 'hsl-color' 
  | 'gradient' 
  | 'password';

export interface RandomRequest {
  type: RndType;
  params: Record<string, any>;
  userId?: string;
  apiKeyId?: string;
}

export interface RandomResponse {
  result: any;
  type: RndType;
  timestamp: Date;
  source: 'esp32' | 'fallback';
  requestId: string;
}

export interface RandomNumberParams {
  min: number;
  max: number;
}

export interface RandomFloatParams {
  min: number;
  max: number;
  precision?: number;
}

export interface RandomChoiceParams {
  choices: string[];
}

export interface RandomStringParams {
  length: number;
  charset?: 'alphanumeric' | 'alpha' | 'numeric' | 'symbols' | 'custom';
  customChars?: string;
}

export interface RandomColorParams {
  format?: 'hex' | 'rgb' | 'hsl';
}

export interface RandomDateParams {
  start: Date;
  end: Date;
}

export interface RandomShuffleParams {
  array: any[];
}

export interface RandomWeightedChoiceParams {
  choices: Array<{ value: string; weight: number }>;
}

export interface RandomPasswordParams {
  length: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeSimilar?: boolean;
}

// Random generation validation rules
export const randomValidation = {
  number: {
    min: -1000000,
    max: 1000000,
  },
  float: {
    min: -1000000,
    max: 1000000,
    maxPrecision: 10,
  },
  string: {
    minLength: 1,
    maxLength: 1000,
  },
  choice: {
    minChoices: 1,
    maxChoices: 1000,
    maxChoiceLength: 1000,
  },
  shuffle: {
    maxArrayLength: 1000,
  },
  password: {
    minLength: 4,
    maxLength: 128,
  },
} as const;

// Random generation business rules
export const randomRules = {
  defaultTimeout: 5000,
  maxRetries: 3,
  fallbackEnabled: true,
  cacheResults: false, // Random results should not be cached
  rateLimitWindow: 60000, // 1 minute
  defaultRateLimit: 30,
} as const;

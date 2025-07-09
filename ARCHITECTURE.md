# Layered Architecture Documentation

## Overview

The RND application has been reorganized into a clean layered architecture that separates concerns and improves maintainability. This document outlines the new structure and migration guidelines.

## Architecture Layers

### 1. Configuration Layer (`config/`)
Centralized configuration management for all application settings.

```
config/
├── app.ts           # Application settings and feature flags
├── database.ts      # Database connection configuration
├── security.ts      # Security policies and settings
└── index.ts         # Combined configuration exports
```

**Purpose**: Single source of truth for all configuration values
**Usage**: `import { config } from './config'`

### 2. Data Layer (`data/`)
Database connections and data access abstractions.

```
data/
├── prisma/
│   └── prisma.ts    # Prisma client configuration
├── redis/
│   └── redis.ts     # Redis client configuration
└── index.ts         # Data layer exports
```

**Purpose**: Isolate database connections and provide clean data access
**Usage**: `import { prisma, getRedisClient } from './data'`

### 3. Core Layer (`core/`)
Business logic, domain models, and services.

```
core/
├── domain/          # Domain models and business rules
│   ├── user.ts      # User domain model
│   ├── api-key.ts   # API Key domain model
│   ├── random.ts    # Random generation domain model
│   └── index.ts     # Domain exports
├── services/        # Business services
│   ├── user-api-key-service.ts
│   ├── auth-service.ts
│   ├── rnd.service.ts
│   └── index.ts     # Services exports
└── repositories/    # Data access patterns (future)
```

**Purpose**: Contains all business logic and domain rules
**Usage**: `import { userApiKeyService } from './core/services'`

### 4. Infrastructure Layer (`infrastructure/`)
External services, middleware, and infrastructure concerns.

```
infrastructure/
├── middleware/      # Application middleware
│   ├── enhanced-security-middleware.ts
│   ├── rate-limiter.ts
│   └── enhanced-auth.ts
├── external/        # External service integrations
│   ├── enhanced-security-monitor.ts
│   └── usage-analytics.ts
└── index.ts         # Infrastructure exports
```

**Purpose**: Handle external dependencies and cross-cutting concerns
**Usage**: `import { enhancedSecurityMiddleware } from './infrastructure'`

### 5. Presentation Layer (`presentation/`)
UI components, layouts, and presentation logic.

```
presentation/
├── layouts/         # Layout components
│   ├── main-layout.tsx
│   ├── dashboard-layout.tsx
│   └── index.ts
└── pages/           # Page-specific components (future)
```

**Purpose**: UI and presentation concerns
**Usage**: `import { MainLayout } from './presentation/layouts'`

### 6. Shared Libraries (`lib/`)
Utilities, types, and shared code.

```
lib/
├── types/           # Type definitions
│   └── common.ts    # Common types
├── constants/       # Application constants
│   └── index.ts     # Constants exports
├── validators/      # Validation schemas
│   └── validation-schemas.ts
├── utils.ts         # Utility functions
└── error-handler.ts # Error handling utilities
```

**Purpose**: Shared utilities and common code
**Usage**: `import { API_ROUTES } from './lib/constants'`

## Migration Guidelines

### Import Path Updates

**Old Structure:**
```typescript
import { userApiKeyService } from '../lib/user-api-key-service';
import { enhancedSecurityMiddleware } from '../lib/enhanced-security-middleware';
import { prisma } from '../lib/prisma';
```

**New Structure:**
```typescript
import { userApiKeyService } from '../core/services';
import { enhancedSecurityMiddleware } from '../infrastructure';
import { prisma } from '../data';
```

### Configuration Usage

**Old:**
```typescript
const rateLimit = parseInt(process.env.RATE_LIMIT_RANDOM_MAX || '30');
```

**New:**
```typescript
import { securityConfig } from '../config';
const rateLimit = securityConfig.rateLimit.maxRequests.random;
```

### Domain Models

**Old:**
```typescript
interface CreateApiKeyData {
  name: string;
  rateLimit?: number;
}
```

**New:**
```typescript
import { CreateApiKeyData } from '../core/domain';
// Type is now centrally defined with validation rules
```

## Benefits

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Dependency Direction**: Dependencies flow inward (infrastructure → core)
3. **Testability**: Easier to mock and test individual layers
4. **Maintainability**: Changes are isolated to specific layers
5. **Scalability**: Easy to add new features following the same patterns

## Backward Compatibility

The main `index.ts` file provides backward compatibility exports:

```typescript
// Still works for existing code
export { userApiKeyService } from './core/services/user-api-key-service';
export { prisma } from './data/prisma/prisma';
```

## Next Steps

1. **Gradual Migration**: Update imports gradually across the codebase
2. **Repository Pattern**: Add repository layer for data access
3. **Use Cases**: Consider adding use case layer for complex business operations
4. **Testing**: Update test imports to use new structure
5. **Documentation**: Update API documentation with new structure

## File Locations

### Moved Files:
- `lib/user-api-key-service.ts` → `core/services/user-api-key-service.ts`
- `lib/auth-service.ts` → `core/services/auth-service.ts`
- `services/rnd.service.ts` → `core/services/rnd.service.ts`
- `lib/enhanced-security-middleware.ts` → `infrastructure/middleware/enhanced-security-middleware.ts`
- `lib/prisma.ts` → `data/prisma/prisma.ts`
- `lib/redis.ts` → `data/redis/redis.ts`

### New Files:
- `config/app.ts` - Application configuration
- `config/database.ts` - Database configuration
- `config/security.ts` - Security configuration
- `core/domain/user.ts` - User domain model
- `core/domain/api-key.ts` - API Key domain model
- `core/domain/random.ts` - Random generation domain model
- `presentation/layouts/main-layout.tsx` - Main layout component
- `presentation/layouts/dashboard-layout.tsx` - Dashboard layout component
- `lib/types/common.ts` - Common type definitions
- `lib/constants/index.ts` - Application constants

This layered architecture provides a solid foundation for scaling the application while maintaining clean separation of concerns.

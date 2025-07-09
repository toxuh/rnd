# 🏗️ Hybrid Architecture: Redis + PostgreSQL

This document explains the hybrid architecture implementation that combines Redis for performance-critical operations with PostgreSQL for persistent data storage.

## 🎯 Architecture Overview

### **Redis (In-Memory)**
- **Rate limiting** - Fast request counting and sliding windows
- **Session caching** - Temporary authentication state
- **Real-time security monitoring** - Immediate threat detection
- **API key caching** - Fast authentication lookups
- **IP blocking** - Instant access control

### **PostgreSQL (Persistent)**
- **User management** - Account information and roles
- **API key metadata** - Permissions, usage tracking, expiration
- **Security audit trail** - Permanent security event logs
- **Usage analytics** - Request history and performance metrics
- **Application configuration** - Dynamic settings management

## 📊 Data Flow

```
Request → Enhanced Security Middleware
    ↓
1. Redis: Check IP blocks & rate limits (fast)
2. Redis: Check cached API key (fast)
3. PostgreSQL: Fallback API key lookup (if not cached)
4. PostgreSQL: Log security events (persistent)
5. PostgreSQL: Log usage analytics (persistent)
    ↓
Response with security headers
```

## 🔧 Key Components

### Enhanced Authentication (`lib/enhanced-auth.ts`)
- **Hybrid key storage**: Cache in Redis, persist in PostgreSQL
- **Permission system**: Granular access control
- **Usage tracking**: Last used timestamps and statistics
- **Key management**: Creation, rotation, and revocation

### Enhanced Security Monitor (`lib/enhanced-security-monitor.ts`)
- **Dual logging**: Real-time Redis + persistent PostgreSQL
- **Threat detection**: Pattern analysis and automatic blocking
- **Alert system**: Configurable thresholds and notifications
- **Audit trail**: Comprehensive security event history

### Usage Analytics (`lib/usage-analytics.ts`)
- **Request logging**: Detailed performance and usage metrics
- **Reporting**: Time-series data and aggregated statistics
- **API key analytics**: Per-key usage patterns
- **Performance monitoring**: Response times and error rates

### Enhanced Security Middleware (`lib/enhanced-security-middleware.ts`)
- **Unified validation**: Single entry point for all security checks
- **Performance optimized**: Redis-first with PostgreSQL fallback
- **Comprehensive logging**: Both security events and usage metrics
- **Flexible configuration**: Per-endpoint security policies

## 🗄️ Database Schema

### Core Tables

#### `users`
- User accounts with roles and permissions
- Links to API keys and usage records
- Supports multi-tenant scenarios

#### `api_keys`
- Enhanced API key management with metadata
- Permissions array for granular access control
- Usage tracking and expiration support

#### `security_events`
- Permanent audit trail of all security events
- Severity levels and event categorization
- IP tracking and pattern analysis

#### `usage_records`
- Detailed request analytics and performance metrics
- API key attribution and user tracking
- Time-series data for reporting

#### `app_config`
- Dynamic application configuration
- Environment-specific settings
- Runtime configuration updates

## 🚀 Setup Instructions

### 1. Database Setup

```bash
# Install dependencies
yarn add prisma @prisma/client

# Generate Prisma client
yarn db:generate

# Set up database (development)
yarn db:push

# Run migrations (production)
yarn db:migrate:deploy

# Seed initial data
yarn db:seed
```

### 2. Environment Variables

```bash
# PostgreSQL Database
DATABASE_URL="postgresql://username:password@localhost:5432/rnd_db?schema=public"

# Redis (existing)
REDIS_URL="redis://localhost:6379"

# API Keys (existing)
API_KEY_MAIN=your_main_key
API_KEY_ADMIN=your_admin_key
API_KEY_LIMITED=your_limited_key
```

### 3. Docker Compose

The updated `docker-compose.yml` includes:
- PostgreSQL service with health checks
- Persistent volumes for both Redis and PostgreSQL
- Environment variable configuration
- Service dependencies

## 📈 Performance Benefits

### **Redis Advantages**
- **Sub-millisecond** rate limit checks
- **Instant** IP blocking and unblocking
- **Fast** API key authentication (cached)
- **Real-time** security monitoring

### **PostgreSQL Advantages**
- **ACID compliance** for critical data
- **Complex queries** for analytics and reporting
- **Data integrity** with foreign keys and constraints
- **Backup and recovery** for audit compliance

### **Hybrid Benefits**
- **Best of both worlds**: Speed + persistence
- **Graceful degradation**: Redis failure doesn't break auth
- **Scalability**: Redis handles high-frequency operations
- **Compliance**: PostgreSQL provides audit trails

## 🔍 Monitoring & Analytics

### New API Endpoints

#### Analytics Dashboard
```bash
GET /api/analytics?timeRange=86400000&apiKeyId=optional
```

#### Enhanced Security Dashboard
```bash
GET /api/security/enhanced-dashboard?timeRange=86400000
POST /api/security/enhanced-dashboard
```

### Key Metrics
- **Request volume** and patterns
- **Response times** and error rates
- **Security events** by type and severity
- **API key usage** and performance
- **Top IPs** and threat analysis

## 🛡️ Security Enhancements

### **Persistent Audit Trail**
- All security events stored permanently
- Compliance with audit requirements
- Historical threat analysis
- Incident investigation support

### **Enhanced API Key Management**
- Metadata tracking (creation, last used, permissions)
- Expiration and rotation support
- Usage analytics per key
- Granular permission system

### **Advanced Threat Detection**
- Pattern analysis across time periods
- Automatic IP blocking for severe violations
- Configurable alert thresholds
- Multi-layered security validation

## 🔄 Migration Strategy

### **Phase 1: Parallel Operation**
- New enhanced services run alongside existing ones
- Gradual migration of endpoints to enhanced middleware
- Data validation and consistency checks

### **Phase 2: Feature Enhancement**
- Enable advanced analytics and reporting
- Implement enhanced security features
- User management and role-based access

### **Phase 3: Full Migration**
- Replace legacy security middleware
- Remove deprecated endpoints
- Optimize performance and cleanup

## 📚 Usage Examples

### **Creating API Keys**
```typescript
import { enhancedApiKeyAuth } from '@/lib/enhanced-auth';

const { key, apiKey } = await enhancedApiKeyAuth.createApiKey({
  name: 'Mobile App Key',
  permissions: ['random:number', 'random:string'],
  rateLimit: 50,
  userId: 'user_123',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
});
```

### **Security Event Logging**
```typescript
import { enhancedSecurityMonitor } from '@/lib/enhanced-security-monitor';

await enhancedSecurityMonitor.logSecurityEvent({
  type: SecurityEventType.SUSPICIOUS_REQUEST,
  ip: '192.168.1.100',
  endpoint: '/api/rnd/number',
  severity: EventSeverity.HIGH,
  details: { reason: 'Unusual request pattern' },
});
```

### **Usage Analytics**
```typescript
import { usageAnalytics } from '@/lib/usage-analytics';

const metrics = await usageAnalytics.getUsageMetrics(
  24 * 60 * 60 * 1000, // 24 hours
  'api_key_id_123'
);
```

## 🎯 Next Steps

1. **Test the hybrid setup** with your local environment
2. **Migrate existing endpoints** to enhanced middleware
3. **Set up monitoring dashboards** for analytics
4. **Configure alerts** for security events
5. **Implement user management** features as needed

This hybrid architecture provides a solid foundation for scaling your RND application while maintaining security and performance.

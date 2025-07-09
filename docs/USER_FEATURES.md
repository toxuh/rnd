# 👥 User-Centric Features

This document outlines the new user authentication and API key management features that make the RND application more user-friendly and scalable.

## 🎯 Overview

The application now supports:
1. **User Authentication** - Sign up, sign in, and profile management
2. **Self-Service API Keys** - Users can generate and manage their own API keys
3. **Public App Access** - Use the web interface without API keys
4. **API Key Policies** - Configurable limits and permissions
5. **Raw ESP32 Access** - Premium feature for authenticated users

## 🔐 Authentication System

### User Registration & Login

#### Sign Up
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

#### Sign In
```bash
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Get Current User
```bash
GET /api/auth/me
Authorization: Bearer <token>
# OR uses HTTP-only cookie automatically
```

#### Sign Out
```bash
POST /api/auth/signout
```

### Password Requirements
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number

## 🔑 API Key Management

### User Dashboard Features

#### List API Keys
```bash
GET /api/user/api-keys
Authorization: Bearer <token>
```

Response includes usage statistics:
```json
{
  "success": true,
  "apiKeys": [
    {
      "id": "key_123",
      "name": "My Mobile App",
      "keyPreview": "rnd_1234567...",
      "permissions": ["random:*"],
      "rateLimit": 100,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "stats": {
        "totalRequests": 1250,
        "lastUsed": "2024-01-15T10:30:00Z",
        "averageResponseTime": 45
      }
    }
  ]
}
```

#### Create API Key
```bash
POST /api/user/api-keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My New API Key",
  "rateLimit": 150,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Important**: The actual API key is only returned once during creation!

#### Update API Key
```bash
PUT /api/user/api-keys/{keyId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "rateLimit": 200,
  "isActive": true
}
```

#### Delete API Key
```bash
DELETE /api/user/api-keys/{keyId}
Authorization: Bearer <token>
```

### API Key Policies

#### Default Limits (Per User)
- **Maximum API Keys**: 5 per user
- **Default Rate Limit**: 100 requests/minute
- **Maximum Rate Limit**: 1000 requests/minute
- **Permissions**: `random:*` (all random generation endpoints)

#### Premium Features
- **ESP32 Raw Access**: Requires `esp32:raw` permission
- **Higher Rate Limits**: Available for premium users
- **Extended Expiration**: Longer-lived keys

## 🌐 Public vs API Access

### Public Web Interface (No API Key Required)

Users can access random generation through the web interface without API keys:

```bash
POST /api/public/rnd/number
Content-Type: application/json

{
  "min": 1,
  "max": 100
}
```

**Features:**
- ✅ Rate limited (30 requests/minute per IP)
- ✅ All random generation types available
- ✅ No authentication required
- ❌ No usage analytics
- ❌ No premium features

### API Access (Requires API Key)

For external applications and integrations:

```bash
POST /api/rnd/number
Content-Type: application/json
x-api-key: your_api_key_here

{
  "min": 1,
  "max": 100
}
```

**Features:**
- ✅ Higher rate limits (100+ requests/minute)
- ✅ Usage analytics and tracking
- ✅ Premium features (ESP32 raw access)
- ✅ Persistent API keys
- ✅ Custom rate limits

## 🔧 ESP32 Raw String Access

### Premium Feature

Access raw entropy strings directly from the ESP32 hardware:

#### Single Raw String
```bash
GET /api/esp32/raw-string
x-api-key: your_api_key_with_esp32_permission
```

Response:
```json
{
  "success": true,
  "rawString": "a8f3e9d2c1b7f4e6...",
  "length": 256,
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "ESP32 Hardware"
}
```

#### Multiple Raw Strings with Filtering
```bash
POST /api/esp32/raw-string
x-api-key: your_api_key_with_esp32_permission
Content-Type: application/json

{
  "count": 5,
  "minLength": 100,
  "maxLength": 500
}
```

**Requirements:**
- Valid API key with `esp32:raw` permission
- Stricter rate limiting (10 requests/5 minutes)
- Premium feature access

## 📊 Usage Analytics

### API Key Analytics

Get detailed usage statistics for your API keys:

```bash
GET /api/user/api-keys/{keyId}/analytics?timeRange=86400000
Authorization: Bearer <token>
```

**Metrics Include:**
- Total requests and success rate
- Average response time
- Requests by endpoint
- Usage over time (daily buckets)
- Error rates and patterns

### Dashboard Features

- **Real-time Usage**: Current request counts and limits
- **Historical Data**: Usage trends over time
- **Performance Metrics**: Response times and error rates
- **Endpoint Analysis**: Most used random generation types

## 🛡️ Security Features

### Enhanced Protection

1. **JWT Authentication**: Secure token-based auth with HTTP-only cookies
2. **Rate Limiting**: Different limits for public vs authenticated access
3. **Input Validation**: Comprehensive request validation
4. **Audit Logging**: All API key usage tracked
5. **Automatic Blocking**: Suspicious activity detection

### Privacy & Security

- **Password Hashing**: bcrypt with 12 salt rounds
- **Secure Cookies**: HTTP-only, secure, SameSite protection
- **Token Expiration**: 7-day JWT token lifetime
- **API Key Hashing**: SHA-256 hashed storage
- **Rate Limit Headers**: Transparent limit information

## 🚀 Getting Started

### For Web Users

1. Visit the application in your browser
2. Use random generation features immediately (no signup required)
3. Sign up for an account to access API features
4. Generate API keys for external applications

### For Developers

1. **Sign up** for an account via the web interface or API
2. **Generate API keys** through the user dashboard
3. **Use API keys** in your applications with higher rate limits
4. **Monitor usage** through the analytics dashboard

### Example Integration

```javascript
// Using the API key in your application
const response = await fetch('https://rnd.so/api/rnd/number', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your_api_key_here'
  },
  body: JSON.stringify({
    min: 1,
    max: 1000
  })
});

const data = await response.json();
console.log('Random number:', data.result);
```

## 📈 Rate Limits Summary

| Access Type | Rate Limit | Features |
|-------------|------------|----------|
| **Public Web** | 30/min per IP | Basic random generation |
| **API Key (Default)** | 100/min | Full features + analytics |
| **API Key (Premium)** | 1000/min | ESP32 raw access |
| **ESP32 Raw** | 10/5min | Hardware entropy strings |

## 🔄 Migration Guide

### Existing API Users

If you're currently using the legacy API endpoints:

1. **Create an account** through the new signup process
2. **Generate API keys** to replace hardcoded keys
3. **Update endpoints** from `/api/rnd/*` to use your new keys
4. **Monitor usage** through the new analytics dashboard

### Backward Compatibility

- Legacy endpoints still work with environment-configured API keys
- New enhanced endpoints provide better features and analytics
- Gradual migration path available

This user-centric approach makes the RND application more scalable, secure, and user-friendly while maintaining the high-quality randomness generation you expect!

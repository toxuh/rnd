# 🔒 Security Features

This document outlines the comprehensive security measures implemented in the RND (Random Number Generator) application.

## 🛡️ Security Overview

The application implements multiple layers of security to protect against various attack vectors:

1. **API Key Authentication** - Restricts access to authorized applications only
2. **Rate Limiting** - Prevents abuse and DoS attacks
3. **Request Validation** - Sanitizes and validates all inputs
4. **Security Monitoring** - Tracks and alerts on suspicious activity
5. **Origin Validation** - Restricts cross-origin requests
6. **Request Signing** - Optional cryptographic verification

## 🔑 API Key Authentication

### Key Types

- **Main App Key** (`API_KEY_MAIN`): Standard application access
- **Admin Key** (`API_KEY_ADMIN`): Full system access including security dashboard
- **Limited Key** (`API_KEY_LIMITED`): Restricted to basic random generation

### Usage

Include the API key in request headers:

```bash
curl -X POST https://rnd.so/api/rnd/number \
  -H "x-api-key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"min": 1, "max": 100}'
```

### Key Management

- Keys are hashed using SHA-256 before storage
- Keys can be rotated by updating environment variables
- Development keys are automatically generated and logged

## ⚡ Rate Limiting

### Limits

- **Global**: 100 requests/minute per IP (configurable)
- **Random Endpoints**: 30 requests/minute per IP+endpoint (configurable)
- **Strict Endpoints**: 10 requests/5 minutes per IP (configurable)

### Implementation

- Uses Redis for distributed rate limiting
- Sliding window algorithm for accurate limiting
- Graceful degradation if Redis is unavailable

### Headers

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1640995200000
Retry-After: 60
```

## 🔍 Security Monitoring

### Event Types

- `rate_limit_exceeded`: Too many requests from IP
- `invalid_api_key`: Authentication failures
- `suspicious_request`: Unusual patterns detected
- `blocked_origin`: Requests from unauthorized origins
- `large_payload`: Oversized request bodies

### Automatic Blocking

- IPs are automatically blocked after 10 security events in 5 minutes
- Blocked IPs receive 403 responses
- Blocks expire automatically (default: 1 hour)

### Security Dashboard

Admin users can access the security dashboard:

```bash
# Get security statistics
curl -X GET https://rnd.so/api/security/dashboard \
  -H "x-api-key: admin_key_here"

# Block an IP
curl -X POST https://rnd.so/api/security/dashboard \
  -H "x-api-key: admin_key_here" \
  -H "Content-Type: application/json" \
  -d '{"action": "block", "ip": "192.168.1.100", "duration": 3600}'

# Unblock an IP
curl -X POST https://rnd.so/api/security/dashboard \
  -H "x-api-key: admin_key_here" \
  -H "Content-Type: application/json" \
  -d '{"action": "unblock", "ip": "192.168.1.100"}'
```

## 🌐 CORS and Origin Validation

### Configuration

Set allowed origins in environment variables:

```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Behavior

- Requests from unauthorized origins are blocked
- CORS headers are automatically added
- Preflight requests are handled correctly

## 📝 Request Validation

### Input Limits

- Request body size: 10KB (configurable)
- String generation: Max 1000 characters
- Array operations: Max 1000 items
- Password generation: Max 128 characters
- Weighted choice: Max 100 items

### Validation

- All inputs are validated using Zod schemas
- Type checking prevents injection attacks
- Size limits prevent resource exhaustion

## 🔐 Request Signing (Optional)

For enhanced security, requests can be cryptographically signed:

### Implementation

```javascript
const timestamp = Date.now().toString();
const body = JSON.stringify(requestData);
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(`${timestamp}.${body}`)
  .digest('hex');

fetch('/api/rnd/number', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-timestamp': timestamp,
    'x-signature': `sha256=${signature}`,
  },
  body,
});
```

## 🚨 Security Headers

All responses include security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

## 📊 Logging and Monitoring

### Request Logging

Enable comprehensive logging:

```bash
ENABLE_REQUEST_LOGGING=true
```

### Log Format

```
[SECURITY] rate_limit_exceeded: 192.168.1.100 -> /api/rnd/number
[SECURITY ALERT] Multiple invalid_api_key events detected from 192.168.1.100
```

## ⚙️ Configuration

### Environment Variables

```bash
# API Keys
API_KEY_MAIN=rnd_your_main_key
API_KEY_ADMIN=rnd_your_admin_key
API_KEY_LIMITED=rnd_your_limited_key

# Security Settings
DISABLE_API_KEY_AUTH=false
ALLOWED_ORIGINS=https://yourdomain.com
WEBHOOK_SECRET=your_webhook_secret

# Rate Limiting
RATE_LIMIT_GLOBAL_MAX=100
RATE_LIMIT_RANDOM_MAX=30
RATE_LIMIT_STRICT_MAX=10

# Additional Security
MAX_REQUEST_SIZE=10240
ENABLE_REQUEST_LOGGING=true
```

## 🔧 Production Deployment

### Security Checklist

- [ ] Generate strong, unique API keys
- [ ] Set restrictive `ALLOWED_ORIGINS`
- [ ] Configure appropriate rate limits
- [ ] Enable request logging
- [ ] Set up monitoring alerts
- [ ] Use HTTPS only
- [ ] Keep dependencies updated
- [ ] Regular security audits

### Docker Security

The application runs with minimal privileges:

- Non-root user in container
- Read-only filesystem where possible
- Network isolation between services
- Secrets managed via environment variables

## 🚨 Incident Response

### Automatic Response

1. **Rate Limiting**: Temporary slowdown for excessive requests
2. **IP Blocking**: Automatic blocking for repeated violations
3. **Alerting**: Console warnings for security events

### Manual Response

1. **Dashboard Monitoring**: Check `/api/security/dashboard`
2. **IP Management**: Block/unblock IPs as needed
3. **Key Rotation**: Update API keys if compromised
4. **Log Analysis**: Review security logs for patterns

## 📞 Security Contact

For security issues or questions:

- Review logs: Check application and security logs
- Monitor dashboard: Use the security dashboard API
- Update configuration: Adjust security settings as needed

---

**Note**: This security implementation provides defense in depth but should be regularly reviewed and updated based on threat landscape changes.

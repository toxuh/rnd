import { NextRequest } from 'next/server';
import { getRedisClient } from './redis';

export interface SecurityEvent {
  type: 'rate_limit_exceeded' | 'invalid_api_key' | 'suspicious_request' | 'blocked_origin' | 'large_payload';
  ip: string;
  userAgent?: string;
  endpoint: string;
  timestamp: number;
  details?: Record<string, unknown>;
}

export class SecurityMonitor {
  private redis = getRedisClient();
  private readonly ALERT_THRESHOLD = 10; // Number of events before alerting
  private readonly ALERT_WINDOW = 5 * 60 * 1000; // 5 minutes

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Store event in Redis with expiration
      const key = `security_event:${event.ip}:${event.type}`;
      const eventData = JSON.stringify(event);
      
      await this.redis.zadd(key, event.timestamp, eventData);
      await this.redis.expire(key, 3600); // Expire after 1 hour

      // Check if we should trigger an alert
      await this.checkForAlerts(event);

      // Log to console if enabled
      if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
        console.warn(`[SECURITY] ${event.type}: ${event.ip} -> ${event.endpoint}`, event.details);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private async checkForAlerts(event: SecurityEvent): Promise<void> {
    try {
      const key = `security_event:${event.ip}:${event.type}`;
      const windowStart = event.timestamp - this.ALERT_WINDOW;
      
      // Count events in the time window
      const eventCount = await this.redis.zcount(key, windowStart, event.timestamp);
      
      if (eventCount >= this.ALERT_THRESHOLD) {
        await this.triggerAlert(event, eventCount);
      }
    } catch (error) {
      console.error('Failed to check for alerts:', error);
    }
  }

  private async triggerAlert(event: SecurityEvent, eventCount: number): Promise<void> {
    const alertKey = `security_alert:${event.ip}:${event.type}`;
    
    // Check if we've already alerted for this IP/type combination recently
    const existingAlert = await this.redis.get(alertKey);
    if (existingAlert) {
      return; // Don't spam alerts
    }

    // Set alert flag with expiration
    await this.redis.setex(alertKey, 300, '1'); // 5 minute cooldown

    const alertMessage = {
      level: 'HIGH',
      type: 'SECURITY_ALERT',
      message: `Multiple ${event.type} events detected`,
      ip: event.ip,
      eventCount,
      timeWindow: this.ALERT_WINDOW / 1000 / 60, // minutes
      timestamp: new Date().toISOString(),
    };

    console.error('[SECURITY ALERT]', alertMessage);

    // In production, you might want to send this to a monitoring service
    // await this.sendToMonitoringService(alertMessage);
  }

  async getSecurityStats(ip?: string): Promise<Record<string, number>> {
    try {
      const pattern = ip ? `security_event:${ip}:*` : 'security_event:*';
      const keys = await this.redis.keys(pattern);
      
      const stats: Record<string, number> = {};
      
      for (const key of keys) {
        const eventType = key.split(':')[2];
        const count = await this.redis.zcard(key);
        stats[eventType] = (stats[eventType] || 0) + count;
      }
      
      return stats;
    } catch (error) {
      console.error('Failed to get security stats:', error);
      return {};
    }
  }

  async isIPBlocked(ip: string): Promise<boolean> {
    try {
      const blockKey = `blocked_ip:${ip}`;
      const blocked = await this.redis.get(blockKey);
      return blocked === '1';
    } catch (error) {
      console.error('Failed to check IP block status:', error);
      return false;
    }
  }

  async blockIP(ip: string, durationSeconds: number = 3600): Promise<void> {
    try {
      const blockKey = `blocked_ip:${ip}`;
      await this.redis.setex(blockKey, durationSeconds, '1');
      
      console.warn(`[SECURITY] IP ${ip} has been blocked for ${durationSeconds} seconds`);
    } catch (error) {
      console.error('Failed to block IP:', error);
    }
  }

  async unblockIP(ip: string): Promise<void> {
    try {
      const blockKey = `blocked_ip:${ip}`;
      await this.redis.del(blockKey);
      
      console.info(`[SECURITY] IP ${ip} has been unblocked`);
    } catch (error) {
      console.error('Failed to unblock IP:', error);
    }
  }

  // Helper method to extract security-relevant info from request
  extractRequestInfo(req: NextRequest): { ip: string; userAgent?: string } {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfConnectingIP = req.headers.get('cf-connecting-ip');
    
    let ip = 'unknown';
    if (forwarded) {
      ip = forwarded.split(',')[0].trim();
    } else if (realIP) {
      ip = realIP;
    } else if (cfConnectingIP) {
      ip = cfConnectingIP;
    }

    const userAgent = req.headers.get('user-agent') || undefined;

    return { ip, userAgent };
  }

  // Method to check for suspicious patterns
  async detectSuspiciousActivity(req: NextRequest): Promise<boolean> {
    const { ip, userAgent } = this.extractRequestInfo(req);
    
    // Check for blocked IP
    if (await this.isIPBlocked(ip)) {
      return true;
    }

    // Check for suspicious user agents
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
    ];

    if (userAgent && suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      await this.logSecurityEvent({
        type: 'suspicious_request',
        ip,
        userAgent,
        endpoint: req.nextUrl.pathname,
        timestamp: Date.now(),
        details: { reason: 'suspicious_user_agent' },
      });
      return true;
    }

    return false;
  }
}

// Singleton instance
export const securityMonitor = new SecurityMonitor();

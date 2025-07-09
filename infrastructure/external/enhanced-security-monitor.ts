import { NextRequest } from 'next/server';
import { prisma } from '../../data/prisma/prisma';
import { getRedisClient } from '../../data/redis/redis';
import { SecurityEventType, EventSeverity } from '@prisma/client';

export interface EnhancedSecurityEvent {
  type: SecurityEventType;
  ip: string;
  userAgent?: string;
  endpoint: string;
  details?: Record<string, unknown>;
  severity?: EventSeverity;
  userId?: string;
}

export interface SecurityStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  topIPs: Array<{ ip: string; count: number }>;
  recentEvents: Array<{
    id: string;
    type: SecurityEventType;
    ip: string;
    endpoint: string;
    severity: EventSeverity;
    createdAt: Date;
  }>;
}

export class EnhancedSecurityMonitor {
  private redis = getRedisClient();
  private readonly ALERT_THRESHOLD = 10; // Number of events before alerting
  private readonly ALERT_WINDOW = 5 * 60 * 1000; // 5 minutes
  private readonly BLOCK_DURATION = 3600; // 1 hour in seconds

  /**
   * Extract request information
   */
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

  /**
   * Log security event to both Redis (for real-time) and PostgreSQL (for persistence)
   */
  async logSecurityEvent(event: EnhancedSecurityEvent): Promise<void> {
    const timestamp = Date.now();

    try {
      // Store in Redis for real-time monitoring (with expiration)
      const redisKey = `security_event:${event.ip}:${event.type}`;
      const eventData = JSON.stringify({ ...event, timestamp });

      await this.redis.zadd(redisKey, timestamp, eventData);
      await this.redis.expire(redisKey, 3600); // Expire after 1 hour

      // Store in PostgreSQL for permanent audit trail
      await prisma.securityEvent.create({
        data: {
          type: event.type,
          ip: event.ip,
          userAgent: event.userAgent,
          endpoint: event.endpoint,
          details: event.details || {},
          severity: event.severity || EventSeverity.LOW,
          userId: event.userId,
        },
      });

      // Check if we should trigger an alert or block
      await this.checkForAlerts(event, timestamp);

      // Log to console if enabled
      if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
        console.warn(`[SECURITY] ${event.type}: ${event.ip} -> ${event.endpoint}`, event.details);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Check for alerts and automatic blocking
   */
  private async checkForAlerts(event: EnhancedSecurityEvent, timestamp: number): Promise<void> {
    try {
      const redisKey = `security_event:${event.ip}:${event.type}`;
      const windowStart = timestamp - this.ALERT_WINDOW;

      // Count events in the time window
      const eventCount = await this.redis.zcount(redisKey, windowStart, timestamp);

      if (eventCount >= this.ALERT_THRESHOLD) {
        await this.triggerAlert(event, eventCount);

        // Auto-block for severe violations
        if (this.shouldAutoBlock(event.type, eventCount)) {
          await this.blockIP(event.ip, this.BLOCK_DURATION);
        }
      }
    } catch (error) {
      console.error('Failed to check for alerts:', error);
    }
  }

  /**
   * Determine if IP should be auto-blocked
   */
  private shouldAutoBlock(eventType: SecurityEventType, eventCount: number): boolean {
    const autoBlockEvents: SecurityEventType[] = [
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecurityEventType.INVALID_API_KEY,
      SecurityEventType.SUSPICIOUS_REQUEST,
    ];

    return autoBlockEvents.includes(eventType) && eventCount >= 15;
  }

  /**
   * Trigger security alert
   */
  private async triggerAlert(event: EnhancedSecurityEvent, eventCount: number): Promise<void> {
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

    // Store alert in database
    await prisma.securityEvent.create({
      data: {
        type: SecurityEventType.SUSPICIOUS_REQUEST,
        ip: event.ip,
        userAgent: event.userAgent,
        endpoint: event.endpoint,
        details: alertMessage,
        severity: EventSeverity.HIGH,
      },
    });
  }

  /**
   * Block an IP address
   */
  async blockIP(ip: string, durationSeconds: number = 3600): Promise<void> {
    try {
      const blockKey = `blocked_ip:${ip}`;
      await this.redis.setex(blockKey, durationSeconds, '1');

      // Log the block event
      await this.logSecurityEvent({
        type: SecurityEventType.IP_BLOCKED,
        ip,
        endpoint: '/system',
        severity: EventSeverity.HIGH,
        details: { duration: durationSeconds, reason: 'Automatic block due to security violations' },
      });

      console.warn(`[SECURITY] IP ${ip} has been blocked for ${durationSeconds} seconds`);
    } catch (error) {
      console.error('Failed to block IP:', error);
    }
  }

  /**
   * Unblock an IP address
   */
  async unblockIP(ip: string): Promise<void> {
    try {
      const blockKey = `blocked_ip:${ip}`;
      await this.redis.del(blockKey);

      // Log the unblock event
      await this.logSecurityEvent({
        type: SecurityEventType.IP_UNBLOCKED,
        ip,
        endpoint: '/system',
        severity: EventSeverity.MEDIUM,
        details: { reason: 'Manual unblock' },
      });

      console.info(`[SECURITY] IP ${ip} has been unblocked`);
    } catch (error) {
      console.error('Failed to unblock IP:', error);
    }
  }

  /**
   * Check if IP is blocked
   */
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

  /**
   * Detect suspicious activity patterns
   */
  async detectSuspiciousActivity(req: NextRequest): Promise<boolean> {
    const { ip } = this.extractRequestInfo(req);

    // Check if IP is blocked
    if (await this.isIPBlocked(ip)) {
      return true;
    }

    // Additional suspicious activity detection can be added here
    // For example: checking for unusual request patterns, known bad IPs, etc.

    return false;
  }

  /**
   * Get comprehensive security statistics
   */
  async getSecurityStats(timeRange: number = 24 * 60 * 60 * 1000): Promise<SecurityStats> {
    try {
      const since = new Date(Date.now() - timeRange);

      // Get events from database
      const events = await prisma.securityEvent.findMany({
        where: {
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100, // Limit recent events
      });

      // Aggregate statistics
      const eventsByType: Record<string, number> = {};
      const eventsBySeverity: Record<string, number> = {};
      const ipCounts: Record<string, number> = {};

      events.forEach(event => {
        eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
        eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
        ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
      });

      // Top IPs by event count
      const topIPs = Object.entries(ipCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, count }));

      return {
        totalEvents: events.length,
        eventsByType,
        eventsBySeverity,
        topIPs,
        recentEvents: events.slice(0, 20).map(event => ({
          id: event.id,
          type: event.type,
          ip: event.ip,
          endpoint: event.endpoint,
          severity: event.severity,
          createdAt: event.createdAt,
        })),
      };
    } catch (error) {
      console.error('Failed to get security stats:', error);
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        topIPs: [],
        recentEvents: [],
      };
    }
  }
}

// Export singleton instance
export const enhancedSecurityMonitor = new EnhancedSecurityMonitor();

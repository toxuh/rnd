"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShieldIcon, 
  AlertTriangleIcon, 
  EyeIcon, 
  BlocksIcon,
  TrendingUpIcon,
  ClockIcon 
} from 'lucide-react';

interface SecurityStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  topIPs: Array<{ ip: string; count: number }>;
  recentEvents: Array<{
    id: string;
    type: string;
    ip: string;
    endpoint: string;
    severity: string;
    createdAt: string;
  }>;
}

interface SecurityDashboardData {
  timestamp: string;
  timeRange: number;
  stats: SecurityStats;
  summary: {
    totalEvents: number;
    eventTypes: number;
    topEventType: string;
    criticalEvents: number;
    highSeverityEvents: number;
  };
  status: string;
}

interface SecurityFilters {
  timeRange: '1h' | '24h' | '7d' | '30d';
}

export function SecurityDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<SecurityDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SecurityFilters>({
    timeRange: '24h',
  });

  useEffect(() => {
    if (user) {
      loadSecurityData();
    }
  }, [user, filters]);

  const loadSecurityData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        timeRange: getTimeRangeMs(filters.timeRange).toString(),
      });

      const response = await fetch(`/api/security/enhanced-dashboard?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        setError(result.error || 'Failed to load security data');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeRangeMs = (range: string): number => {
    switch (range) {
      case '1h': return 3600000; // 1 hour
      case '24h': return 86400000; // 24 hours
      case '7d': return 604800000; // 7 days
      case '30d': return 2592000000; // 30 days
      default: return 86400000;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'rate_limit_exceeded': return <TrendingUpIcon className="h-4 w-4" />;
      case 'invalid_api_key': return <ShieldIcon className="h-4 w-4" />;
      case 'suspicious_request': return <AlertTriangleIcon className="h-4 w-4" />;
      case 'blocked_origin': return <BlocksIcon className="h-4 w-4" />;
      default: return <EyeIcon className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Please sign in to view security dashboard
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading security data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadSecurityData} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            No security data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldIcon className="h-5 w-5" />
              Security Dashboard
            </CardTitle>
            <div className="flex gap-2">
              <Select
                value={filters.timeRange}
                onValueChange={(value: any) => setFilters(prev => ({ ...prev, timeRange: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={loadSecurityData} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{formatNumber(data.summary.totalEvents)}</p>
              </div>
              <EyeIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Events</p>
                <p className="text-2xl font-bold text-red-600">{formatNumber(data.summary.criticalEvents)}</p>
              </div>
              <AlertTriangleIcon className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Severity</p>
                <p className="text-2xl font-bold text-orange-600">{formatNumber(data.summary.highSeverityEvents)}</p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className={`text-lg font-bold ${data.status === 'operational' ? 'text-green-600' : 'text-red-600'}`}>
                  {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                </p>
              </div>
              <ShieldIcon className={`h-8 w-8 ${data.status === 'operational' ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Types */}
        <Card>
          <CardHeader>
            <CardTitle>Event Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.stats.eventsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getEventTypeIcon(type)}
                    <span className="text-sm font-medium">{type.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-sm font-bold">{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top IPs */}
        <Card>
          <CardHeader>
            <CardTitle>Top IPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.stats.topIPs.slice(0, 10).map((ipData, index) => (
                <div key={ipData.ip} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted px-2 py-1 rounded">#{index + 1}</span>
                    <span className="text-sm font-mono">{ipData.ip}</span>
                  </div>
                  <span className="text-sm font-bold">{formatNumber(ipData.count)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.stats.recentEvents.slice(0, 20).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-3">
                  {getEventTypeIcon(event.type)}
                  <div>
                    <p className="text-sm font-medium">{event.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{event.endpoint}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{event.ip}</span>
                  <span className={`text-xs px-2 py-1 rounded border ${getSeverityColor(event.severity)}`}>
                    {event.severity}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

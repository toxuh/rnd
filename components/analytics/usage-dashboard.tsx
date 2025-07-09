"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3Icon, TrendingUpIcon, ClockIcon, KeyIcon, ActivityIcon } from 'lucide-react';

interface UsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  averageResponseTime: number;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
    percentage: number;
  }>;
  requestsByHour: Array<{
    hour: number;
    count: number;
  }>;
  requestsByDay: Array<{
    date: string;
    count: number;
  }>;
  apiKeyUsage: Array<{
    keyId: string;
    keyName: string;
    requests: number;
    lastUsed: string;
  }>;
}

interface AnalyticsFilters {
  timeRange: '1h' | '24h' | '7d' | '30d';
  apiKeyId?: string;
}

export function UsageDashboard() {
  const { user, apiKeys } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeRange: '24h',
  });

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, filters]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        timeRange: getTimeRangeMs(filters.timeRange).toString(),
      });

      if (filters.apiKeyId) {
        params.append('apiKeyId', filters.apiKeyId);
      }

      const response = await fetch(`/api/analytics?${params}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data.data);
      } else {
        setError(data.error || 'Failed to load analytics');
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

  const formatTimeRange = (range: string): string => {
    switch (range) {
      case '1h': return 'Last Hour';
      case '24h': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      default: return 'Last 24 Hours';
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Please sign in to view usage analytics
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
            <span className="ml-2">Loading analytics...</span>
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
            <Button onClick={loadAnalytics} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            No analytics data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3Icon className="h-5 w-5" />
              Usage Analytics
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

              <Select
                value={filters.apiKeyId || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  apiKeyId: value === 'all' ? undefined : value 
                }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All API Keys</SelectItem>
                  {apiKeys.map(key => (
                    <SelectItem key={key.id} value={key.id}>
                      {key.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={loadAnalytics} variant="outline" size="sm">
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
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{formatNumber(stats.totalRequests)}</p>
              </div>
              <ActivityIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{formatTimeRange(filters.timeRange)}</p>
                <p className="text-2xl font-bold">
                  {filters.timeRange === '24h' ? formatNumber(stats.requestsToday) :
                   filters.timeRange === '7d' ? formatNumber(stats.requestsThisWeek) :
                   filters.timeRange === '30d' ? formatNumber(stats.requestsThisMonth) :
                   formatNumber(stats.requestsToday)}
                </p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{stats.averageResponseTime}ms</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active API Keys</p>
                <p className="text-2xl font-bold">{apiKeys.filter(k => k.isActive).length}</p>
              </div>
              <KeyIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>Top Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topEndpoints.map((endpoint, index) => (
                <div key={endpoint.endpoint} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {endpoint.endpoint}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(endpoint.count)} ({endpoint.percentage.toFixed(1)}%)
                    </span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${endpoint.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* API Key Usage */}
        <Card>
          <CardHeader>
            <CardTitle>API Key Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.apiKeyUsage.map((keyUsage) => (
                <div key={keyUsage.keyId} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{keyUsage.keyName}</p>
                    <p className="text-sm text-muted-foreground">
                      Last used: {new Date(keyUsage.lastUsed).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatNumber(keyUsage.requests)}</p>
                    <p className="text-sm text-muted-foreground">requests</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

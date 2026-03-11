'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  TrendingUp,
  Eye,
  Download,
  Users,
  Image as ImageIcon,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsData {
  totalViews: number;
  totalDownloads: number;
  totalUsers: number;
  totalImages: number;
  viewsChange: number;
  downloadsChange: number;
  usersChange: number;
  imagesChange: number;
  topImages: Array<{
    id: string;
    url: string;
    views: number;
    downloads: number;
    author: string;
  }>;
  viewsOverTime: Array<{
    date: string;
    views: number;
  }>;
  referrers: Array<{
    source: string;
    count: number;
  }>;
}

interface AnalyticsDashboardProps {
  className?: string;
}

// Simple bar chart component without recharts
function SimpleBarChart({ data }: { data: Array<{ date: string; views: number }> }) {
  const maxValue = Math.max(...data.map((d) => d.views), 1);

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 w-16 truncate">{item.date}</span>
          <div className="flex-1 h-6 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${(item.views / maxValue) * 100}%` }}
            />
          </div>
          <span className="text-xs text-neutral-600 w-12 text-right">{item.views}</span>
        </div>
      ))}
    </div>
  );
}

// Simple horizontal bar chart for referrers
function ReferrerChart({ data }: { data: Array<{ source: string; count: number }> }) {
  const maxValue = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 w-24 truncate">{item.source}</span>
          <div className="flex-1 h-5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(item.count / maxValue) * 100}%` }}
            />
          </div>
          <span className="text-xs text-neutral-600 w-10 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

// Stat card component
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: {
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-neutral-500">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            {change !== 0 && (
              <div
                className={cn(
                  'flex items-center gap-1 text-sm',
                  change > 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {change > 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>{Math.abs(change)}%</span>
                <span className="text-neutral-400">较上月</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'p-3 rounded-full',
              trend === 'up'
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                : trend === 'down'
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                  : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/analytics?range=${timeRange}`);

        if (!response.ok) {
          // If API doesn't exist yet, use mock data
          if (response.status === 404) {
            setStats(getMockData());
            return;
          }
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        // Use mock data on error
        setStats(getMockData());
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [timeRange]);

  const getMockData = (): StatsData => ({
    totalViews: 15420,
    totalDownloads: 3420,
    totalUsers: 856,
    totalImages: 1240,
    viewsChange: 12.5,
    downloadsChange: 8.3,
    usersChange: -2.1,
    imagesChange: 15.7,
    topImages: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100',
        views: 1205,
        downloads: 156,
        author: 'user1',
      },
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=100',
        views: 892,
        downloads: 123,
        author: 'user2',
      },
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=100',
        views: 756,
        downloads: 98,
        author: 'user3',
      },
    ],
    viewsOverTime: [
      { date: '周一', views: 2340 },
      { date: '周二', views: 2890 },
      { date: '周三', views: 2156 },
      { date: '周四', views: 3120 },
      { date: '周五', views: 2890 },
      { date: '周六', views: 3567 },
      { date: '周日', views: 2457 },
    ],
    referrers: [
      { source: '直接访问', count: 5234 },
      { source: 'Google', count: 3456 },
      { source: '社交媒体', count: 2345 },
      { source: '外部链接', count: 1234 },
      { source: '其他', count: 567 },
    ],
  });

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-neutral-500">暂无数据</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">数据分析</h2>
          <p className="text-neutral-500">查看平台使用统计和趋势</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">最近24小时</SelectItem>
            <SelectItem value="7d">最近7天</SelectItem>
            <SelectItem value="30d">最近30天</SelectItem>
            <SelectItem value="90d">最近90天</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总浏览量"
          value={stats.totalViews}
          change={stats.viewsChange}
          icon={Eye}
          trend="up"
        />
        <StatCard
          title="总下载量"
          value={stats.totalDownloads}
          change={stats.downloadsChange}
          icon={Download}
          trend="up"
        />
        <StatCard
          title="用户总数"
          value={stats.totalUsers}
          change={stats.usersChange}
          icon={Users}
          trend="neutral"
        />
        <StatCard
          title="图片总数"
          value={stats.totalImages}
          change={stats.imagesChange}
          icon={ImageIcon}
          trend="up"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="views" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="views">浏览趋势</TabsTrigger>
          <TabsTrigger value="referrers">流量来源</TabsTrigger>
        </TabsList>

        <TabsContent value="views">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                浏览量趋势
              </CardTitle>
              <CardDescription>每日浏览量统计</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={stats.viewsOverTime} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrers">
          <Card>
            <CardHeader>
              <CardTitle>流量来源</CardTitle>
              <CardDescription>用户访问来源分布</CardDescription>
            </CardHeader>
            <CardContent>
              <ReferrerChart data={stats.referrers} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top Images */}
      <Card>
        <CardHeader>
          <CardTitle>热门图片</CardTitle>
          <CardDescription>浏览量最高的图片</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.topImages.map((image, index) => (
              <a
                key={image.id}
                href={`/image/${image.id}`}
                className="group relative aspect-[4/3] rounded-lg overflow-hidden"
              >
                <img
                  src={image.url}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-medium">#{index + 1}</p>
                  <div className="flex items-center gap-3 text-white/80 text-xs mt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {image.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" /> {image.downloads}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
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
    name: string;
    value: number;
  }>;
}

interface AnalyticsDashboardProps {
  className?: string;
}
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
    { id: '1', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100', views: 1205, downloads: 156, author: 'user1' },
    { id: '2', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=100', views: 892, downloads: 123, author: 'user2' },
    { id: '3', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=100', views: 756, downloads: 98, author: 'user3' },
    { id: '4', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=100', views: 643, downloads: 87, author: 'user4' },
    { id: '5', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100', views: 521, downloads: 76, author: 'user5' },
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
    { name: '直接访问', value: 5234 },
    { name: 'Google', value: 3456 },
    { name: '社交媒体', value: 2345 },
    { name: '外部链接', value: 1234 },
    { name: '其他', value: 567 },
  ],
});

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

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
  const [timeRange, setTimeRange] = useState('7d');
  const [stats] = useState<StatsData>(getMockData());

  return (
    <div className={cn('space-y-6', className)}>
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
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.viewsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: '#6366f1', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
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
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.referrers}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      dataKey="value"
                    >
                      {stats.referrers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>热门图片</CardTitle>
          <CardDescription>浏览量最高的图片</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.topImages.map((image, index) => (
              <a
                key={image.id}
                href={`/image/${image.id}`}
                className="group relative aspect-square rounded-lg overflow-hidden"
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

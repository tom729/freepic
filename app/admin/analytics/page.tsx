import { Metadata } from 'next';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

export const metadata: Metadata = {
  title: '数据分析 - FreePic',
  description: '查看平台统计数据和分析报告',
};

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}

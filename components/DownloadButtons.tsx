'use client';

import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useEffect, useState } from 'react';

interface DownloadButtonsProps {
  imageId: string;
  width?: number;
  height?: number;
}

export function DownloadButtons({ imageId, width, height }: DownloadButtonsProps) {
  const { token, isAuthenticated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [downloadingSize, setDownloadingSize] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // 等待 Zustand persist 完成 hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleDownload = async (size: 'regular' | 'large') => {
    if (!isAuthenticated || !token) {
      alert('请先登录后再下载图片');
      return;
    }

    const sizeLabel = size === 'regular' ? '中尺寸' : '大尺寸';
    setDownloadingSize(size);

    try {
      const response = await fetch(`/api/images/${imageId}/download?size=${size}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        alert('请先登录后再下载图片');
        return;
      }

      if (response.status === 403) {
        alert('账号未激活，请先查收激活邮件并完成激活');
        return;
      }

      if (!response.ok) {
        throw new Error('下载失败');
      }

      // 获取 blob 数据并触发下载
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = ''; // 浏览器会根据 Content-Disposition 头自动设置文件名
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // 显示成功提示
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Download failed:', error);
      alert('下载失败，请重试');
    } finally {
      setDownloadingSize(null);
    }
  };

  // 如果还没完成 hydration，显示 loading 状态
  if (!isHydrated) {
    return (
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
        <h3 className="mb-3 sm:mb-4 font-semibold text-gray-900 text-sm sm:text-base">下载图片</h3>
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
      <h3 className="mb-3 sm:mb-4 font-semibold text-gray-900 text-sm sm:text-base">下载图片</h3>

      {/* 成功提示 */}
      {showSuccess && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>下载已开始</span>
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        <button
          onClick={() => handleDownload('regular')}
          disabled={!isAuthenticated || downloadingSize !== null}
          className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 min-h-[44px] transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-left">
            <span className="font-medium text-gray-900 text-sm sm:text-base">中尺寸</span>
            <p className="text-xs text-gray-500">1080px 宽度</p>
          </div>
          {downloadingSize === 'regular' ? (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-500" />
          ) : (
            <Download className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          )}
        </button>
        <button
          onClick={() => handleDownload('large')}
          disabled={!isAuthenticated || downloadingSize !== null}
          className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 min-h-[44px] transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-left">
            <span className="font-medium text-gray-900 text-sm sm:text-base">大尺寸</span>
            <p className="text-xs text-gray-500">2048px 宽度</p>
          </div>
          {downloadingSize === 'large' ? (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-500" />
          ) : (
            <Download className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}

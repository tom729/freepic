'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, X, Eye, Loader2, RefreshCw, AlertCircle, Trash2, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface Image {
  id: string;
  cosKey: string;
  status: 'pending' | 'approved' | 'rejected';
  width: number;
  height: number;
  fileSize: number;
  exifData: {
    camera?: string;
    cameraMake?: string;
    cameraModel?: string;
  } | null;
  createdAt: string;
  user: {
    id: string;
    phone: string;
  } | null;
}

export default function ModerationPage() {
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/moderation?status=${activeTab}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleModerate = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/admin/moderation/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
        credentials: 'include',
      });

      if (response.ok) {
        // 从列表中移除
        setImages((prev) => prev.filter((img) => img.id !== id));
      }
    } catch (error) {
      console.error('Moderation failed:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这张图片吗？此操作不可恢复。')) {
      return;
    }
    
    setProcessingId(id);
    try {
      const response = await fetch(`/api/admin/moderation/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // 从列表中移除
        setImages((prev) => prev.filter((img) => img.id !== id));
      } else {
        const error = await response.json();
        alert(error.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('删除失败');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnapprove = async (id: string) => {
    if (!confirm('确定要取消通过这张图片吗？图片将回到待审核状态。')) {
      return;
    }
    
    setProcessingId(id);
    try {
      const response = await fetch(`/api/admin/moderation/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
        credentials: 'include',
      });

      if (response.ok) {
        // 从列表中移除
        setImages((prev) => prev.filter((img) => img.id !== id));
      }
    } catch (error) {
      console.error('Unapprove failed:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getImageUrl = (cosKey: string) => {
    if (cosKey.startsWith('uploads/')) {
      return `/${cosKey}`;
    }
    // Mock images
    return `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3" />
            待审核
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="h-3 w-3" />
            已通过
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="h-3 w-3" />
            已拒绝
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">图片审核</h1>
            <p className="text-gray-500 text-sm mt-1">管理用户上传的图片内容</p>
          </div>
          <button
            onClick={fetchImages}
            disabled={isLoading}
            className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 min-h-[44px] bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {(['pending', 'approved', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'pending' && '待审核'}
                  {tab === 'approved' && '已通过'}
                  {tab === 'rejected' && '已拒绝'}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">
                  {activeTab === 'pending' && '没有待审核的图片'}
                  {activeTab === 'approved' && '没有已通过的图片'}
                  {activeTab === 'rejected' && '没有已拒绝的图片'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Image Preview */}
                    <div className="aspect-video bg-gray-100 relative group">
                      <img
                        src={getImageUrl(image.cosKey)}
                        alt="待审核图片"
                        className="w-full h-full object-cover"
                      />
                      <Link
                        href={`/image/${image.id}`}
                        target="_blank"
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </Link>
                    </div>

                    {/* Info */}
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        {getStatusBadge(image.status)}
                        <span className="text-xs text-gray-500">
                          {new Date(image.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                        <p>
                          <span className="text-gray-400">上传者: </span>
                          {image.user?.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '未知'}
                        </p>
                        <p>
                          <span className="text-gray-400">尺寸: </span>
                          {image.width} × {image.height}
                        </p>
                        <p>
                          <span className="text-gray-400">大小: </span>
                          {formatFileSize(image.fileSize)}
                        </p>
                        {image.exifData?.camera && (
                          <p>
                            <span className="text-gray-400">相机: </span>
                            {image.exifData.camera}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {activeTab === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleModerate(image.id, 'approve')}
                            disabled={processingId === image.id}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 min-h-[44px] bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {processingId === image.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                通过
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleModerate(image.id, 'reject')}
                            disabled={processingId === image.id}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 min-h-[44px] bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            {processingId === image.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <X className="h-4 w-4" />
                                拒绝
                              </>
                            )}
                          </button>
                        </div>
                      )}


                      {/* Actions for approved/rejected tabs */}
                      {activeTab === 'approved' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUnapprove(image.id)}
                            disabled={processingId === image.id}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 min-h-[44px] bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                          >
                            {processingId === image.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RotateCcw className="h-4 w-4" />
                                取消通过
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(image.id)}
                            disabled={processingId === image.id}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 min-h-[44px] bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            {processingId === image.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                删除
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {activeTab === 'rejected' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleModerate(image.id, 'approve')}
                            disabled={processingId === image.id}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 min-h-[44px] bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {processingId === image.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                通过
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(image.id)}
                            disabled={processingId === image.id}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 min-h-[44px] bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            {processingId === image.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                删除
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ImageCard, ImageItem, ImageCardSkeleton } from '@/components/ImageCard';
import { Search, X, Upload, ImageIcon, Sparkles } from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Search mode: 'semantic' | 'visual'
  const [searchMode, setSearchMode] = useState<'semantic' | 'visual'>('semantic');

  // Visual search state
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [queryTags, setQueryTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Semantic search
  const performSemanticSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), limit: 40 }),
      });

      if (!response.ok) throw new Error('Semantic search failed');

      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Semantic search error:', error);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  // Visual search functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearVisualSearch = () => {
    setUploadedImage(null);
    setUploadedImagePreview(null);
    setQueryTags([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const performVisualSearch = async () => {
    if (!uploadedImage) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const formData = new FormData();
      formData.append('image', uploadedImage);

      const response = await fetch('/api/search/visual', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Visual search failed');
      }

      const data = await response.json();
      setImages(data.images || []);
      setQueryTags(data.queryTags || []);
    } catch (error) {
      console.error('Visual search error:', error);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const switchSearchMode = (mode: 'semantic' | 'visual') => {
    setSearchMode(mode);
    setImages([]);
    setHasSearched(false);
    if (mode === 'semantic') {
      clearVisualSearch();
    } else {
      setQuery('');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === 'semantic') {
      performSemanticSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-8">
        {/* 搜索标题 */}
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">搜索图片</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            语义搜索用自然语言描述，以图搜图上传相似图片
          </p>
        </div>

        {/* 搜索模式切换 */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => switchSearchMode('semantic')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                searchMode === 'semantic'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              语义搜索
            </button>
            <button
              type="button"
              onClick={() => switchSearchMode('visual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                searchMode === 'visual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              以图搜图
            </button>
          </div>
        </div>

        {/* 搜索表单 */}
        <div className="max-w-3xl mx-auto mb-6 sm:mb-8">
          {searchMode === 'semantic' ? (
            /* Semantic Search Form */
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="用自然语言描述你想要的图片，如：夕阳下的海边公路、山间晨雾..."
                  className="block w-full pl-9 sm:pl-11 pr-10 sm:pr-4 py-3 sm:py-4 border border-gray-200 rounded-lg sm:rounded-xl text-gray-900 placeholder-gray-400 bg-white transition-shadow focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">AI 会理解你的描述，找到概念相关的图片</p>
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="px-4 sm:px-6 py-2 min-h-[44px] bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-sm">搜索中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm">语义搜索</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Image Upload Area */}
              {!uploadedImagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">上传图片搜索</h3>
                  <p className="text-gray-500 mb-4">点击上传或拖拽图片到此处</p>
                  <p className="text-sm text-gray-400">支持 JPG、PNG、WebP 格式，最大 10MB</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Uploaded Image Preview */}
                  <div className="relative rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={uploadedImagePreview}
                      alt="Uploaded preview"
                      className="w-full max-h-64 object-contain"
                    />
                    <button
                      type="button"
                      onClick={clearVisualSearch}
                      className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Query Tags Display */}
                  {queryTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-500">识别到的标签:</span>
                      {queryTags.slice(0, 8).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {queryTags.length > 8 && (
                        <span className="text-sm text-gray-400">+{queryTags.length - 8}</span>
                      )}
                    </div>
                  )}

                  {/* Search Button */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={clearVisualSearch}
                      className="flex-1 px-4 py-3 min-h-[44px] border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      重新选择
                    </button>
                    <button
                      type="button"
                      onClick={performVisualSearch}
                      disabled={isLoading}
                      className="flex-1 px-4 sm:px-6 py-3 min-h-[44px] bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="text-sm">搜索中...</span>
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          <span className="text-sm">搜索相似图片</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* 搜索结果 */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <ImageCardSkeleton key={i} />
              ))}
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {images.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onClick={() => router.push(`/image/${image.id}`)}
                />
              ))}
            </div>
          ) : hasSearched && !isLoading ? (
            /* 空状态 */
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {searchMode === 'visual' ? '未找到相似图片' : '未找到图片'}
              </h3>
              <p className="text-gray-500">
                {searchMode === 'visual' ? '尝试上传其他图片' : '尝试其他描述方式'}
              </p>
            </div>
          ) : (
            /* 初始状态 - 提示语 */ <div className="text-center py-16 text-gray-400">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>输入描述或上传图片开始搜索</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

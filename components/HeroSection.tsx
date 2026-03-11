'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

const popularTags = ['风景', '人像', '自然', '城市', '动物', '建筑'];

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleTagClick = (tag: string) => {
    router.push(`/search?q=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="relative min-h-[500px] sm:min-h-[560px] flex items-center justify-center overflow-hidden">
      {/* Background gradient with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950" />
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
          Free High-Quality Images
        </h1>
        <p className="text-base sm:text-lg text-neutral-300 mb-8 max-w-2xl mx-auto">
          Browse thousands of copyright-free images from talented photographers around the world
        </p>

        {/* Search bar - Unsplash style */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-400 group-focus-within:text-neutral-600 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索图片..."
              className="block w-full pl-12 sm:pl-14 pr-4 py-4 sm:py-5 text-base sm:text-lg bg-white/95 backdrop-blur-sm border-0 rounded-lg sm:rounded-xl text-neutral-900 placeholder-neutral-400 shadow-2xl transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-white/20 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute inset-y-2 right-2 px-4 sm:px-6 bg-neutral-900 text-white text-sm font-medium rounded-md sm:rounded-lg hover:bg-neutral-800 transition-colors"
            >
              搜索
            </button>
          </div>
        </form>

        {/* Popular tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span className="text-neutral-400 text-sm mr-1">热门搜索:</span>
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="px-3 sm:px-4 py-1.5 text-sm text-white/90 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all duration-200"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom gradient fade */}
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 dark:from-neutral-950 to-transparent" />
    </div>
  );
}

import { HeroSection } from '@/components/HeroSection';
import { MasonryGallery } from '@/components/MasonryGallery';
import { CollectionsSection } from '@/components/CollectionsSection';
import { StatisticsSection } from '@/components/StatisticsSection';
import { FeaturedPhotographersSection } from '@/components/FeaturedPhotographersSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Hero section - Unsplash style */}
      <HeroSection />

      {/* Gallery section */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
            精选图片
          </h2>
          <a
            href="/search"
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            查看全部
          </a>
        </div>
        <MasonryGallery />
      </div>

      {/* Collections Section */}
      <CollectionsSection />

      {/* Statistics Section */}
      <StatisticsSection />

      {/* Featured Photographers Section */}
      <FeaturedPhotographersSection />
    </div>
  );
}

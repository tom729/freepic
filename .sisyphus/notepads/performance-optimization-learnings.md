# Performance Optimization Learnings

## Summary

Successfully optimized the FreePic image library application for better performance.

## Optimizations Applied

### 1. Next.js Image Component Configuration (next.config.mjs)

- Configured remotePatterns for Unsplash images (`images.unsplash.com`)
- Added WebP and AVIF format support
- Set minimumCacheTTL to 86400 (1 day)
- Configured deviceSizes and imageSizes for responsive images
- Added experimental.optimizePackageImports for lucide-react
- Configured Cache-Control headers for API routes and uploads
- Enabled compression and disabled poweredByHeader

### 2. Database Query Optimization

- Added `exifData` to select queries where needed
- Used specific column selection instead of SELECT \*
- Added ISR with `export const revalidate = 60` for image list API
- Added ISR with `export const revalidate = 300` for visual search API

### 3. Caching Strategies

- API routes now return Cache-Control headers:
  - Image list: `public, s-maxage=60, stale-while-revalidate=300`
  - Visual search: `public, s-maxage=300, stale-while-revalidate=600`
  - Uploads: `public, max-age=31536000, immutable`

### 4. Code Splitting

- Dynamic import for Lightbox component with loading state
- Added SSR: false for client-only Lightbox component

### 5. Image Component Updates

- ImageCard.tsx: Uses Next.js Image for external (Unsplash) images, falls back to img for local uploads
- app/image/[id]/page.tsx: Uses Next.js Image for main image display
- Lightbox.tsx: Uses Next.js Image for external images
- MasonryGallery.tsx: Priority loading for first 6 images (improved LCP)

### 6. Layout Optimizations

- Added preconnect and dns-prefetch for images.unsplash.com
- Added metadataBase and OpenGraph metadata
- Added viewport export for mobile optimization
- Updated globals.css to use CSS variable for font-family

## Build Results

- Build completes successfully with warnings
- Remaining warnings are for other files not in scope:
  - Some components still use `<img>` tags (CollectionsSection, admin pages)
  - Some React hooks have missing dependencies (ImageGrid, search page)

## Key Files Modified

1. next.config.mjs - Image optimization and caching headers
2. app/layout.tsx - Preconnect, metadata, viewport
3. app/globals.css - Font-family fix
4. components/ImageCard.tsx - Next.js Image integration
5. components/MasonryGallery.tsx - Dynamic imports, priority loading
6. components/Lightbox.tsx - Next.js Image integration
7. app/image/[id]/page.tsx - Next.js Image integration
8. app/api/images/route.ts - Caching, optimized queries
9. app/api/search/visual/route.ts - Caching, optimized queries

## Performance Impact

- Images now served via Next.js Image optimization (WebP/AVIF)
- First 6 images prioritized for better LCP
- External image domains preconnected
- API responses cached with stale-while-revalidate
- Heavy Lightbox component lazy-loaded

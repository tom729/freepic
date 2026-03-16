'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb navigation component with Schema.org structured data
 *
 * Usage:
 * <Breadcrumb items={[
 *   { label: '首页', href: '/' },
 *   { label: '搜索', href: '/search' },
 *   { label: '结果' }
 * ]} />
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  // Generate Schema.org structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://tuku.mepai.me'}${item.href}`
        : undefined,
    })),
  };

  return (
    <>
      {/* Schema.org JSON-LD for breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-500 mb-4">
        <ol className="flex items-center flex-wrap gap-1">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />}
              {index === 0 && <Home className="h-4 w-4 mr-1 text-gray-400" />}
              {item.href ? (
                <Link href={item.href} className="hover:text-gray-700 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-700 font-medium" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

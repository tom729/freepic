export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tags } from '@/lib/schema';
import { desc, sql, like } from 'drizzle-orm';

// List all tags with image counts, support ?query= for autocomplete
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '50');

    let results;

    if (query) {
      // Search mode: filter by name
      const searchPattern = `%${query}%`;
      results = await db
        .select({
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          description: tags.description,
          color: tags.color,
          imageCount: tags.imageCount,
          createdAt: tags.createdAt,
        })
        .from(tags)
        .where(like(tags.name, searchPattern))
        .orderBy(desc(tags.imageCount))
        .limit(limit);
    } else {
      // List mode: return all tags sorted by image count
      results = await db
        .select({
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          description: tags.description,
          color: tags.color,
          imageCount: tags.imageCount,
          createdAt: tags.createdAt,
        })
        .from(tags)
        .orderBy(desc(tags.imageCount))
        .limit(limit);
    }

    return NextResponse.json({
      tags: results.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        color: tag.color,
        imageCount: tag.imageCount,
        createdAt: tag.createdAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

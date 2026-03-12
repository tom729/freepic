'use client';

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bookmark, Check, Plus, Loader2, FolderHeart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateCollectionModal } from './CreateCollectionModal';

interface Collection {
  id: string;
  name: string;
  imageCount: number;
  isPublic: boolean;
}

interface AddToCollectionButtonProps {
  imageId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function AddToCollectionButton({
  imageId,
  className,
  variant = 'outline',
  size = 'default',
}: AddToCollectionButtonProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [imageCollections, setImageCollections] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [open, setOpen] = useState(false);

  // Fetch user's collections and check if image is in any collection
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setIsFetching(true);
      try {
        // Fetch user collections
        const collectionsRes = await fetch('/api/collections?user=true');
        if (collectionsRes.ok) {
          const data = await collectionsRes.json();
          setCollections(data.collections || []);
        }

        // Check which collections contain this image
        const imageCollectionsRes = await fetch(`/api/images/${imageId}/collections`);
        if (imageCollectionsRes.ok) {
          const data = await imageCollectionsRes.json();
          setImageCollections(new Set(data.collections?.map((c: Collection) => c.id) || []));
        }
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [open, imageId]);

  const handleToggleCollection = async (collectionId: string) => {
    if (isLoading) return;

    setIsLoading(true);
    const isInCollection = imageCollections.has(collectionId);

    try {
      const response = await fetch(`/api/collections/${collectionId}/images/${imageId}`, {
        method: isInCollection ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setImageCollections((prev) => {
          const next = new Set(prev);
          if (isInCollection) {
            next.delete(collectionId);
          } else {
            next.add(collectionId);
          }
          return next;
        });

        // Update collection count
        setCollections((prev) =>
          prev.map((c) =>
            c.id === collectionId
              ? { ...c, imageCount: c.imageCount + (isInCollection ? -1 : 1) }
              : c
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = (newCollection: { id: string; name: string }) => {
    setCollections((prev) => [
      {
        id: newCollection.id,
        name: newCollection.name,
        imageCount: 0,
        isPublic: true,
      },
      ...prev,
    ]);
    // Automatically add the current image to the new collection
    handleToggleCollection(newCollection.id);
  };

  const isInAnyCollection = imageCollections.size > 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isInAnyCollection ? 'default' : variant}
          size={size}
          className={cn('gap-2', className)}
        >
          {isInAnyCollection ? (
            <>
              <FolderHeart className="h-4 w-4" />
              <span className="hidden sm:inline">已收藏</span>
              <span className="sm:hidden">{imageCollections.size}</span>
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">收藏</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5 text-sm font-medium text-neutral-500">添加到合集</div>
        <DropdownMenuSeparator />

        {isFetching ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
          </div>
        ) : collections.length === 0 ? (
          <div className="px-2 py-3 text-sm text-neutral-500 text-center">还没有合集</div>
        ) : (
          <div className="max-h-48 overflow-auto">
            {collections.map((collection) => {
              const isSelected = imageCollections.has(collection.id);
              return (
                <DropdownMenuItem
                  key={collection.id}
                  onClick={() => handleToggleCollection(collection.id)}
                  disabled={isLoading}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="truncate">{collection.name}</span>
                    <span className="text-xs text-neutral-400 flex-shrink-0">
                      ({collection.imageCount})
                    </span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}

        <DropdownMenuSeparator />

        <CreateCollectionModal
          onSuccess={handleCreateSuccess}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              创建新合集
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

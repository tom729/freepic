'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Lock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateCollectionModalProps {
  trigger?: React.ReactNode;
  onSuccess?: (collection: { id: string; name: string }) => void;
  className?: string;
}

export function CreateCollectionModal({
  trigger,
  onSuccess,
  className,
}: CreateCollectionModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('请输入合集名称');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          isPublic: formData.isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '创建失败');
      }

      const collection = await response.json();

      // Reset form
      setFormData({ name: '', description: '', isPublic: true });
      setOpen(false);

      onSuccess?.(collection);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      setOpen(newOpen);
      if (!newOpen) {
        setError(null);
        setFormData({ name: '', description: '', isPublic: true });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className={cn('gap-2', className)}>
            <Plus className="h-4 w-4" />
            创建合集
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>创建新合集</DialogTitle>
            <DialogDescription>创建一个合集来整理你喜欢的图片</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Error Message */}
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                合集名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：风景摄影"
                maxLength={50}
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-neutral-500">{formData.name.length}/50</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述一下这个合集的内容..."
                maxLength={200}
                rows={3}
                disabled={isLoading}
              />
              <p className="text-xs text-neutral-500">{formData.description.length}/200</p>
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  {formData.isPublic ? (
                    <Globe className="h-5 w-5 text-indigo-600" />
                  ) : (
                    <Lock className="h-5 w-5 text-neutral-500" />
                  )}
                </div>
                <div>
                  <Label htmlFor="visibility" className="cursor-pointer">
                    {formData.isPublic ? '公开合集' : '私密合集'}
                  </Label>
                  <p className="text-sm text-neutral-500">
                    {formData.isPublic ? '所有人都可以看到这个合集' : '只有你可以看到这个合集'}
                  </p>
                </div>
              </div>
              <Switch
                id="visibility"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建合集'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

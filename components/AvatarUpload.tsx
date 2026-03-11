'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Loader2, X } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  name?: string;
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}

// Helper function to add style suffix to avatar URL for COS images
function getAvatarUrl(url: string | null | undefined): string {
  if (!url) return '';
  // Skip if it's a data URL (preview)
  if (url.startsWith('data:')) return url;
  // Skip if it's a local upload
  if (url.startsWith('/uploads/')) return url;
  // For COS images, add /thumb suffix
  if (url.includes('tukupic.mepai.me')) {
    return url + '/thumb';
  }
  return url;
}

export function AvatarUpload({ currentAvatar, name, onUpload, isUploading }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = name || '用户';
  const initials = displayName.slice(0, 2).toUpperCase();

  // 处理文件选择
  const handleFileSelect = useCallback(
    async (file: File) => {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }

      // 验证文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过 5MB');
        return;
      }

      // 创建预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // 上传
      try {
        await onUpload(file);
        setPreview(null); // 上传成功后清除预览
      } catch (error) {
        setPreview(null);
      }
    },
    [onUpload]
  );

  // 处理 input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 处理拖拽
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // 清除预览
  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      {/* 头像显示 */}
      <div
        className={`
          relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden
          bg-gradient-to-br from-indigo-500 to-purple-600
          flex items-center justify-center
          text-white text-2xl sm:text-4xl font-bold
          cursor-pointer
          transition-all duration-200
          ${isDragging ? 'ring-4 ring-indigo-300 scale-105' : 'hover:ring-4 hover:ring-indigo-200'}
        `}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : currentAvatar ? (
          <img src={getAvatarUrl(currentAvatar)} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}

        {/* 上传遮罩 */}
        {!isUploading && !preview && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
            <Camera className="w-8 h-8" />
          </div>
        )}

        {/* 上传中状态 */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
      </div>

      {/* 清除预览按钮 */}
      {preview && !isUploading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            clearPreview();
          }}
          className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* 提示文字 */}
      <p className="mt-2 text-xs text-center text-gray-500">点击或拖拽上传头像</p>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}

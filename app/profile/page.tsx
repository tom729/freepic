'use client';

import { useState, useEffect } from 'react';
import { ImageCard, ImageItem } from '@/components/ImageCard';
import {
  LogOut,
  Loader2,
  ImageIcon,
  Download,
  Edit3,
  X,
  MapPin,
  Instagram,
  Twitter,
  Globe,
  Upload,
} from 'lucide-react';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user;
  const isAuthLoading = status === 'loading';
  const user = session?.user;
  const logout = () => signOut({ callbackUrl: '/' });
  const updateUser = () => {};
  const [uploads, setUploads] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    instagram: '',
    twitter: '',
  });

  // 计算统计数据
  const stats = {
    totalUploads: uploads.length,
    totalDownloads: uploads.reduce((sum, img) => sum + (img.downloads || 0), 0),
  };

  // 检查登录状态 - 等待 auth store 从 localStorage 恢复完成
  useEffect(() => {
    // 等待状态恢复完成后再判断
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // 加载数据
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      loadProfile();
      loadUploads();
    }
  }, [isAuthenticated, isAuthLoading]);

  // 加载用户资料
  const loadProfile = async () => {
    try {
      const response = await fetch('/api/users/me', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setEditForm({
          name: data.user.name || '',
          bio: data.user.bio || '',
          location: data.user.location || '',
          website: data.user.website || '',
          instagram: data.user.instagram || '',
          twitter: data.user.twitter || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  // 加载用户上传的图片
  const loadUploads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/me/uploads', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUploads(data.images || []);
      }
    } catch (error) {
      console.error('Failed to load uploads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存资料
  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setIsEditing(false);
      } else {
        alert('保存失败');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('保存失败');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleDelete = async (image: ImageItem) => {
    try {
      const response = await fetch(`/api/images/${image.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setUploads((prev) => prev.filter((img) => img.id !== image.id));
      } else {
        const data = await response.json();
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('删除失败');
    }
  };

  // 格式化社交链接
  const getSocialLink = (platform: 'instagram' | 'twitter', handle: string) => {
    if (!handle) return null;
    const cleanHandle = handle.replace(/^@/, '');
    if (platform === 'instagram') return `https://instagram.com/${cleanHandle}`;
    if (platform === 'twitter') return `https://twitter.com/${cleanHandle}`;
    return null;
  };

  // 等待 auth store 恢复或用户未登录
  if (isAuthLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const displayName = profile?.name || profile?.email?.split('@')[0] || '摄影师';
  const displayEmail = profile?.email || user?.email || 'Unknown';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-8 mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Avatar Upload */}
            <AvatarUpload
              currentAvatar={profile?.avatar}
              name={displayName}
              onUpload={async (file) => {
                const formData = new FormData();
                formData.append('avatar', file);
                const response = await fetch('/api/users/me/avatar', {
                  method: 'POST',
                  credentials: 'include',
                  body: formData,
                });
                if (response.ok) {
                  const data = await response.json();
                  setProfile((prev) => (prev ? { ...prev, avatar: data.avatarUrl } : null));
                } else {
                  const error = await response.json();
                  alert(error.error || '头像上传失败');
                  throw new Error(error.error);
                }
              }}
              isUploading={isUploadingAvatar}
            />

            {/* User Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{displayName}</h1>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-fit"
                >
                  <Edit3 className="h-4 w-4" />
                  编辑资料
                </button>
              </div>

              <p className="text-gray-500 text-sm mb-2">{displayEmail}</p>

              {profile?.bio && <p className="text-gray-700 text-sm mb-3 max-w-xl">{profile.bio}</p>}

              {/* Social Links */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {profile?.location && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                )}
                {profile?.website && (
                  <a
                    href={
                      profile.website.startsWith('http')
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                  >
                    <Globe className="h-4 w-4" />
                    网站
                  </a>
                )}
                {profile?.instagram && (
                  <a
                    href={getSocialLink('instagram', profile.instagram) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-pink-600 hover:text-pink-700"
                  >
                    <Instagram className="h-4 w-4" />@{profile.instagram}
                  </a>
                )}
                {profile?.twitter && (
                  <a
                    href={getSocialLink('twitter', profile.twitter) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                  >
                    <Twitter className="h-4 w-4" />@{profile.twitter}
                  </a>
                )}
              </div>

              {/* Statistics */}
              <div className="flex items-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{stats.totalUploads} 张照片</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Download className="h-4 w-4" />
                  <span className="text-sm font-medium">{stats.totalDownloads} 次下载</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 min-h-[44px] text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm sm:text-base"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              退出登录
            </button>
          </div>
        </div>

        {/* Uploads Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <div className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">我的上传</span>
                <span className="sm:hidden">上传</span>
              </div>
            </nav>
          </div>

          <div className="p-3 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : uploads.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">还没有上传过图片</p>
                <a
                  href="/upload"
                  className="inline-block mt-3 sm:mt-4 px-4 py-2 min-h-[44px] bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
                >
                  去上传
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {uploads.map((image) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    onClick={() => router.push(`/image/${image.id}`)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">编辑资料</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="你的昵称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="介绍一下你自己..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所在地</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="例如：北京，中国"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">个人网站</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="https://your-website.com"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      value={editForm.instagram}
                      onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                      placeholder="username"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter / X
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      value={editForm.twitter}
                      onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                      placeholder="username"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Bell, Mail, MessageCircle, Reply, Users, Image } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

interface UserPreferences {
  emailNotifications: boolean;
  notifyOnComment: boolean;
  notifyOnReply: boolean;
  notifyOnFollow: boolean;
  notifyOnImageStatus: boolean;
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    notifyOnComment: true,
    notifyOnReply: true,
    notifyOnFollow: true,
    notifyOnImageStatus: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const { isAuthenticated } = useAuthStore();

  // Fetch preferences on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/me/preferences');
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences({
            emailNotifications: data.preferences.emailNotifications,
            notifyOnComment: data.preferences.notifyOnComment,
            notifyOnReply: data.preferences.notifyOnReply,
            notifyOnFollow: data.preferences.notifyOnFollow,
            notifyOnImageStatus: data.preferences.notifyOnImageStatus,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/users/me/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setSaveMessage('Preferences saved successfully');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setSaveMessage('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof UserPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg bg-gray-50 p-6 text-center">
        <p className="text-gray-600">Please log in to manage notification preferences.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600"></div>
      </div>
    );
  }

  const preferenceItems = [
    {
      key: 'emailNotifications' as const,
      icon: Mail,
      title: 'Email Notifications',
      description: 'Receive email notifications for important updates',
    },
    {
      key: 'notifyOnComment' as const,
      icon: MessageCircle,
      title: 'Comments on Your Images',
      description: 'Get notified when someone comments on your images',
    },
    {
      key: 'notifyOnReply' as const,
      icon: Reply,
      title: 'Replies to Your Comments',
      description: 'Get notified when someone replies to your comments',
    },
    {
      key: 'notifyOnFollow' as const,
      icon: Users,
      title: 'New Followers',
      description: 'Get notified when someone follows you',
    },
    {
      key: 'notifyOnImageStatus' as const,
      icon: Image,
      title: 'Image Approval Status',
      description: 'Get notified when your images are approved or rejected',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
          <Bell className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
          <p className="text-sm text-gray-500">Choose what notifications you want to receive</p>
        </div>
      </div>

      <div className="space-y-4">
        {preferenceItems.map((item) => {
          const Icon = item.icon;
          const isEnabled = preferences[item.key];

          return (
            <div
              key={item.key}
              className="flex items-start justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
            >
              <div className="flex gap-3">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                    isEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>

              <button
                onClick={() => handleToggle(item.key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={isEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {saveMessage && (
        <div
          className={`rounded-lg p-3 text-center text-sm ${
            saveMessage.includes('success')
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {saveMessage}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={isSaving}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
              Saving...
            </span>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>
    </div>
  );
}

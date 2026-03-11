'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const success = searchParams.get('success');
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const error = searchParams.get('error');

    // Handle error from redirect
    if (error) {
      setStatus('error');
      switch (error) {
        case 'missing_token':
          setMessage('无效的验证链接');
          break;
        case 'invalid_token':
          setMessage('验证链接无效，请重新获取');
          break;
        case 'already_used':
          setMessage('此链接已被使用，请直接登录');
          break;
        case 'expired':
          setMessage('验证链接已过期，请重新获取');
          break;
        default:
          setMessage('验证失败，请重试');
      }
      return;
    }

    // Handle success (redirected from API) - JWT token is longer and contains dots
    const jwtToken = searchParams.get('token');
    if (success === 'true' && jwtToken && userId && email) {
      setStatus('success');

      // Set user in store
      setUser(
        {
          id: userId,
          email: decodeURIComponent(email),
          createdAt: new Date().toISOString(),
        },
        jwtToken
      );

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
      return;
    }

    // If verification token is present (64 hex chars), redirect to API
    if (token && !success && token.length === 64) {
      // Use window.location for full page redirect to API
      window.location.href = `/api/auth/verify-email?token=${token}`;
      return;
    }

    // No params - show error
    setStatus('error');
    setMessage('无效的验证链接');
  }, [searchParams, setUser, router]);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      {status === 'loading' && (
        <>
          <Loader2 className="h-16 w-16 text-indigo-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">正在验证...</h2>
          <p className="text-gray-600">请稍候</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">验证成功！</h2>
          <p className="text-gray-600 mb-4">正在跳转到首页...</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>跳转中...</span>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">验证失败</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            返回登录
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <Loader2 className="h-16 w-16 text-indigo-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">正在验证...</h2>
              <p className="text-gray-600">请稍候</p>
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>

        <p className="mt-8 text-center text-sm text-gray-500">
          <Link href="/" className="text-indigo-600 hover:underline">
            返回首页
          </Link>
        </p>
      </div>
    </div>
  );
}

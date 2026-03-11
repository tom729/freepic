import { useAuthStore } from '@/stores/auth';
import { useEffect } from 'react';

// 验证 JWT Token 是否有效
export function useAuth() {
  const { token, user, logout, setLoading } = useAuthStore();

  useEffect(() => {
    // 检查 token 是否存在
    if (!token) {
      setLoading(false);
      return;
    }

    // 这里可以添加 token 过期验证逻辑
    // 简单起见，我们只检查是否存在
    setLoading(false);
  }, [token, setLoading]);

  return {
    isAuthenticated: !!token && !!user,
    user,
    token,
    logout,
  };
}

// 获取当前用户的请求头（用于 API 请求）
export function getAuthHeaders(): Record<string, string> {
  const { token } = useAuthStore.getState();

  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  return {};
}

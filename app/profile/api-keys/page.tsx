'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ApiKey {
  id: string;
  name: string;
  description: string | null;
  key: string;
  plan: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
}

interface ApiPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  dailyLimit: number;
  price: number;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPlan, setNewKeyPlan] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/keys', { credentials: 'include' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setKeys(data.keys || []);
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to fetch keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          planId: newKeyPlan || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreatedKey(data.key.key);
        setShowCreateModal(false);
        setNewKeyName('');
        setNewKeyPlan('');
        fetchKeys();
      }
    } catch (error) {
      console.error('Failed to create key:', error);
    }
  };

  const revokeKey = async (keyId: string) => {
    if (!confirm('确定要禁用此 API Key 吗？此操作不可撤销。')) {
      return;
    }

    try {
      const res = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        fetchKeys();
      }
    } catch (error) {
      console.error('Failed to revoke key:', error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '从未使用';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/profile" className="hover:text-gray-700">
              个人资料
            </Link>
            <span>/</span>
            <span className="text-gray-700">API Keys</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys 管理</h1>
          <p className="text-gray-600 mt-1">管理你的 API Keys，用于外部 AI Agent 访问网站资源</p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            当前有 <span className="font-semibold">{keys.length}</span> 个 API Key
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 创建新 Key
          </button>
        </div>

        {/* Keys List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {keys.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>暂无 API Keys</p>
              <p className="text-sm mt-1">点击上方按钮创建你的第一个 API Key</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名称
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    套餐
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最后使用
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{key.name}</div>
                      {key.description && (
                        <div className="text-sm text-gray-500">{key.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                        {key.key}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {key.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {key.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          正常
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          已禁用
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(key.lastUsedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {key.isActive && (
                        <button
                          onClick={() => revokeKey(key.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          禁用
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Documentation Link */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">API 文档</h3>
          <p className="text-sm text-blue-700 mb-3">了解如何使用 API Key 访问网站资源</p>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-mono">GET /api/anp/capabilities</span>
              <span className="text-gray-600">- 获取站点能力清单</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-mono">GET /api/anp/images</span>
              <span className="text-gray-600">- 获取图片列表</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-mono">GET /api/anp/search</span>
              <span className="text-gray-600">- 语义搜索图片</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-gray-500">请求头:</span>
              <code className="text-sm bg-white px-2 py-1 rounded">x-api-key: fp_xxxxx</code>
            </div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">创建 API Key</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="例如: 我的AI助手"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {plans.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      套餐 (可选)
                    </label>
                    <select
                      value={newKeyPlan}
                      onChange={(e) => setNewKeyPlan(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">默认免费套餐</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - {plan.price === 0 ? '免费' : `¥${plan.price / 100}/月`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={createKey}
                  disabled={!newKeyName}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Created Key Modal */}
        {createdKey && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4 text-green-600">API Key 已创建</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ 请妥善保存此 Key</p>
                <p className="text-sm text-yellow-700">
                  关闭此对话框后将无法再次查看完整 Key，请立即使用。
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">你的 API Key</label>
                <code className="block w-full p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                  {createdKey}
                </code>
              </div>
              <button
                onClick={() => setCreatedKey(null)}
                className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                我已保存
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

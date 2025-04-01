'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/useToast';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@/components/ui/toast';

export default function SettingsPage() {
  const {
    user,
    profile,
    isLoading,
    error,
    updateProfile,
    updateAvatar,
  } = useProfile();

  const { toast, showToast, hideToast } = useToast();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [avatarKey, setAvatarKey] = useState(0);

  // 添加时间戳到头像URL以避免缓存
  const avatarUrl = profile?.avatar_url 
    ? `${profile.avatar_url}?t=${avatarKey}`
    : 'https://www.gravatar.com/avatar/default?s=200';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      showToast('错误', '两次输入的密码不一致', 'error');
      return;
    }
    const success = await updateProfile(formData);
    if (success) {
      showToast('成功', '保存成功', 'success');
      // 清空密码字段
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newAvatarUrl = await updateAvatar(file);
    if (newAvatarUrl) {
      setAvatarKey(Date.now()); // 更新 key 以强制重新加载图片
      showToast('成功', '头像更新成功', 'success');
    }
  };

  if (isLoading) {
    return <div className="p-6">加载中...</div>;
  }

  return (
    <ToastProvider>
      <AppLayout showNav={true}>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <h2 className="text-2xl font-semibold text-gray-900">设置</h2>

            {/* 个人资料设置 */}
            <div className="mt-6 bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">个人资料</h3>
                {error && (
                  <div className="mt-2 text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div className="mt-5">
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      {/* 头像上传 */}
                      <div className="flex items-center space-x-4">
                        <img
                          src={avatarUrl}
                          alt="头像"
                          className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div>
                          <input
                            type="file"
                            id="avatar"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('avatar')?.click()}
                            className="bg-gray-100 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200"
                          >
                            更换头像
                          </button>
                          <p className="mt-1 text-sm text-gray-500">支持JPG/PNG格式</p>
                        </div>
                      </div>

                      {/* 用户名 */}
                      <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                          用户名
                        </label>
                        <input
                          type="text"
                          id="username"
                          value={formData.username || profile?.username || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>

                      {/* 邮箱 */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          电子邮箱
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={user?.email || ''}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
                          disabled
                        />
                      </div>

                      {/* 密码 */}
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          修改密码 (留空不修改)
                        </label>
                        <input
                          type="password"
                          id="password"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="输入新密码"
                        />
                      </div>

                      {/* 确认密码 */}
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                          确认密码
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="再次输入新密码"
                        />
                      </div>

                      {/* 提交按钮 */}
                      <div>
                        <button
                          type="submit"
                          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 font-medium"
                        >
                          保存修改
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* 通知设置 */}
            <div className="mt-6 bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">通知设置</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>配置你想要接收的通知类型</p>
                </div>
                <div className="mt-5">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="email_notifications"
                          name="email_notifications"
                          type="checkbox"
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="email_notifications" className="font-medium text-gray-700">
                          邮件通知
                        </label>
                        <p className="text-gray-500">当有新的任务或更新时通过邮件通知我</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 主题设置 */}
            <div className="mt-6 bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">主题设置</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>自定义应用的外观</p>
                </div>
                <div className="mt-5">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Button variant="outline" size="sm">
                        浅色
                      </Button>
                      <Button variant="outline" size="sm">
                        深色
                      </Button>
                      <Button variant="outline" size="sm">
                        跟随系统
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </AppLayout>

      {/* Toast 组件 */}
      <Toast
        open={toast.open}
        onOpenChange={hideToast}
        variant={toast.type}
      >
        <ToastTitle>{toast.title}</ToastTitle>
        {toast.description && (
          <ToastDescription>{toast.description}</ToastDescription>
        )}
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );
}

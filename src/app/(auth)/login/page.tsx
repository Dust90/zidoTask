'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type AuthTab = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const [currentTab, setCurrentTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signInWithPassword, signInWithGoogle, signInWithGitea, signUp, resetPassword } = useAuth();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;

      if (currentTab === 'login') {
        result = await signInWithPassword(email, password);
      } else if (currentTab === 'register') {
        if (password !== confirmPassword) {
          throw new Error('密码不匹配');
        }
        result = await signUp(email, password);
      } else if (currentTab === 'forgot') {
        result = await resetPassword(email);
      }

      if (result?.error) {
        throw result.error;
      }

      if (currentTab === 'forgot') {
        alert('重置密码邮件已发送，请查收');
      } else if (currentTab === 'register') {
        alert('注册成功，请查收验证邮件');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      // Supabase 会自动处理重定向
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGiteaSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGitea();
      // GiteaService 会处理重定向
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Gitea');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Google button clicked');
    handleGoogleSignIn();
  };

  const onGiteaButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Gitea button clicked');
    handleGiteaSignIn();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center items-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* 头部 */}
        <div className="bg-primary-600 text-white p-6 text-center">
          <h1 className="text-xl font-semibold">任务管理系统</h1>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setCurrentTab('login')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              currentTab === 'login'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setCurrentTab('register')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              currentTab === 'register'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            注册
          </button>
          <button
            onClick={() => setCurrentTab('forgot')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              currentTab === 'forgot'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            找回密码
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          {currentTab === 'login' && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    电子邮箱
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-colors"
                    placeholder="请输入注册邮箱"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-colors"
                    placeholder="请输入密码"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentTab('forgot')}
                    className="text-sm text-gray-500 hover:text-primary-600 mt-2 block text-right"
                  >
                    忘记密码？
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? '登录中...' : '登录'}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">或</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onGoogleButtonClick}
                  disabled={loading}
                  className={`w-full py-3 px-4 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4"/>
                    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
                    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4069 3.78409 7.83 3.96409 7.29V4.9582H0.957273C0.347727 6.1731 0 7.5477 0 9C0 10.4523 0.347727 11.8269 0.957273 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                  </svg>
                  <span>使用 Google 登录</span>
                </button>

                <button
                  type="button"
                  onClick={onGiteaButtonClick}
                  disabled={loading}
                  className={`w-full py-3 px-4 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="#609926"/>
                  </svg>
                  <span>使用 Gitea 登录</span>
                </button>
              </div>
            </form>
          )}

          {currentTab === 'register' && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="registerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    电子邮箱
                  </label>
                  <input
                    type="email"
                    id="registerEmail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-colors"
                    placeholder="请输入邮箱"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="registerPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                  </label>
                  <input
                    type="password"
                    id="registerPassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-colors"
                    placeholder="请设置密码"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    确认密码
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-colors"
                    placeholder="请再次输入密码"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? '注册中...' : '注册'}
                </button>
              </div>
            </form>
          )}

          {currentTab === 'forgot' && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    电子邮箱
                  </label>
                  <input
                    type="email"
                    id="forgotEmail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-colors"
                    placeholder="请输入注册邮箱"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? '发送中...' : '发送重置链接'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

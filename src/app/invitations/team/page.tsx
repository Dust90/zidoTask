'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { acceptTeamInvitation, declineTeamInvitation } from '@/lib/api';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import Link from 'next/link';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function TeamInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<{
    team_name?: string;
    role?: string;
    email?: string;
  } | null>(null);
  
  const supabase = createClientComponentClient<Database>();
  
  // 获取邀请信息
  useEffect(() => {
    const fetchInvitationData = async () => {
      if (!token) {
        setError('无效的邀请链接');
        setIsLoading(false);
        return;
      }
      
      try {
        // 获取邀请信息
        const { data: invitation, error: invitationError } = await supabase
          .from('team_invitations')
          .select(`
            *,
            team:team_id (
              name
            )
          `)
          .eq('token', token)
          .single();
        
        if (invitationError || !invitation) {
          setError('邀请不存在或已过期');
          setIsLoading(false);
          return;
        }
        
        // 检查邀请状态
        if (invitation.status !== 'pending') {
          setError(`邀请已${invitation.status === 'accepted' ? '被接受' : '被拒绝'}`);
          setIsLoading(false);
          return;
        }
        
        // 设置邀请数据
        setInvitationData({
          team_name: invitation.team?.name,
          role: invitation.role,
          email: invitation.email,
        });
        
        // 检查用户是否已登录
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // 用户未登录，需要先登录
          // 保存邀请 token 到 localStorage，以便登录后重定向回来
          localStorage.setItem('pendingInvitationToken', token);
          setError('请先登录后再接受邀请');
          setIsLoading(false);
          return;
        }
        
        // 检查用户邮箱是否与邀请邮箱匹配
        if (user.email !== invitation.email) {
          setError(`此邀请发送给 ${invitation.email}，请使用该邮箱账号登录`);
          setIsLoading(false);
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching invitation:', error);
        setError('获取邀请信息时出错');
        setIsLoading(false);
      }
    };
    
    fetchInvitationData();
  }, [token, supabase]);
  
  // 接受邀请
  const handleAccept = async () => {
    if (!token) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await acceptTeamInvitation(token);
      setSuccess('您已成功加入团队！');
      
      // 3秒后跳转到团队页面
      setTimeout(() => {
        router.push('/teams');
      }, 3000);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError(error.message || '接受邀请时出错');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 拒绝邀请
  const handleDecline = async () => {
    if (!token) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await declineTeamInvitation(token);
      setSuccess('您已拒绝此邀请');
      
      // 3秒后跳转到首页
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error: any) {
      console.error('Error declining invitation:', error);
      setError(error.message || '拒绝邀请时出错');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 登录处理
  const handleLogin = () => {
    // 保存当前 URL 到 localStorage
    if (token) {
      localStorage.setItem('pendingInvitationToken', token);
    }
    router.push('/login');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">正在加载邀请信息...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <XMarkIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">邀请错误</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            
            {error.includes('请先登录') && (
              <button
                onClick={handleLogin}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                去登录
              </button>
            )}
            
            <div className="mt-6">
              <Link
                href="/"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">操作成功</h3>
            <p className="mt-2 text-sm text-gray-500">{success}</p>
            <p className="mt-1 text-sm text-gray-500">即将为您跳转...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">团队邀请</h2>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-1">您被邀请加入团队：</p>
          <p className="text-lg font-semibold text-gray-900">{invitationData?.team_name}</p>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-1">您的角色将是：</p>
          <p className="text-lg font-semibold text-gray-900">
            {invitationData?.role === 'admin' ? '管理员' : 
             invitationData?.role === 'member' ? '成员' : 
             invitationData?.role === 'guest' ? '访客' : 
             invitationData?.role}
          </p>
        </div>
        
        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '处理中...' : '接受邀请'}
          </button>
          
          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className="flex-1 bg-white text-gray-700 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '处理中...' : '拒绝邀请'}
          </button>
        </div>
      </div>
    </div>
  );
}

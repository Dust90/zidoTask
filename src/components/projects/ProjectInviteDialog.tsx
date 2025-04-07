import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserIcon, MagnifyingGlassIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { addProjectMember, type ProjectMember } from '@/lib/api';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ProjectInviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (member: ProjectMember) => void;
  projectId: string;
}

export default function ProjectInviteDialog({ 
  isOpen, 
  onClose, 
  onInvite, 
  projectId 
}: ProjectInviteDialogProps) {
  const [userId, setUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [role, setRole] = useState<ProjectMember['role']>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{id: string, username: string, avatar_url?: string}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{id: string, username: string, avatar_url?: string} | null>(null);
  const supabase = createClientComponentClient();
  
  // 监听搜索输入变化
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // 搜索用户
  const handleSearch = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      // 实际调用Supabase API搜索用户，只通过username搜索
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .limit(10);
        
      if (error) throw error;
      
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('搜索用户时出错');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: {id: string, username: string, avatar_url?: string}) => {
    setUserId(user.id);
    setSelectedUser(user);
    setSearchQuery(''); // 清空搜索查询
    setSearchResults([]);
    
    // 检查用户是否已是项目成员
    checkExistingMember(user.id);
  };
  
  // 检查用户是否已是项目成员
  const checkExistingMember = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', uid)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        setError('该用户已是项目成员');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Error checking existing member:', err);
      // 不显示错误，让用户继续操作
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('请选择一个用户');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 先检查用户是否已是项目成员
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (existingMember) {
        setError('该用户已是项目成员');
        setIsSubmitting(false);
        return;
      }
      
      // 添加项目成员
      await addProjectMember(projectId, userId, role);
      
      // 如果已有用户信息，直接使用
      let userData = selectedUser ? {
        ...selectedUser,
        // 不再尝试使用email字段
      } : null;
      
      // 如果没有，查询用户信息以获取更完整的数据
      if (!userData) {
        const { data } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', userId)
          .single();
          
        userData = {
          id: userId,
          username: data?.username || '',
          avatar_url: data?.avatar_url
        };
      }
      
      // 创建成员对象
      const newMember: ProjectMember = {
        project_id: projectId,
        user_id: userId,
        role: role,
        joined_at: new Date().toISOString(),
        username: userData.username || '',
        avatar_url: userData.avatar_url
      };
      
      onInvite(newMember);
      resetForm();
    } catch (err) {
      console.error('Error adding member:', err);
      setError('添加成员时出错，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setUserId('');
    setSearchQuery('');
    setRole('member');
    setError(null);
    setSearchResults([]);
    setSelectedUser(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={handleClose}
                  >
                    <span className="sr-only">关闭</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      添加项目成员
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        通过用户名搜索用户，然后将其添加为项目成员。
                      </p>
                      
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* 搜索用户 */}
                        <div>
                          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                            搜索用户（输入用户名）
                          </label>
                          <div className="relative mt-1 rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                              type="text"
                              id="search"
                              className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="输入用户名（至少3个字符）"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              disabled={Boolean(userId) || isSubmitting}
                            />
                          </div>
                          
                          {/* 搜索状态显示 */}
                          {isSearching && (
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                              搜索中...
                            </div>
                          )}
                          
                          {/* 搜索结果 */}
                          {searchResults.length > 0 && (
                            <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                              <ul className="divide-y divide-gray-200">
                                {searchResults.map((user) => (
                                  <li 
                                    key={user.id} 
                                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                    onClick={() => handleSelectUser(user)}
                                  >
                                    <div className="flex-shrink-0">
                                      {user.avatar_url ? (
                                        <img 
                                          className="h-10 w-10 rounded-full object-cover border border-gray-200" 
                                          src={user.avatar_url} 
                                          alt={user.username} 
                                        />
                                      ) : (
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                          <UserIcon className="h-5 w-5 text-indigo-500" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-3 flex-1">
                                      <p className="text-sm font-medium text-gray-900">{user.username || '未设置用户名'}</p>
                                      <p className="text-xs text-gray-500">用户ID: {user.id}</p>
                                    </div>
                                    <div className="ml-2">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                        选择
                                      </span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* 无搜索结果提示 */}
                          {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md text-center">
                              <p className="text-sm text-gray-500 flex items-center justify-center">
                                <ExclamationCircleIcon className="h-5 w-5 text-amber-500 mr-2" />
                                未找到匹配的用户
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                请尝试其他搜索词，或确认用户已在系统中注册
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* 已选择的用户 */}
                        {userId && selectedUser && (
                          <div className="mt-2 bg-gray-50 p-4 rounded-md border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-medium text-gray-900">已选择用户</p>
                              <button
                                type="button"
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                onClick={() => {
                                  setUserId('');
                                  setSelectedUser(null);
                                  setError(null);
                                }}
                              >
                                更改选择
                              </button>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                {selectedUser.avatar_url ? (
                                  <img 
                                    className="h-10 w-10 rounded-full object-cover border border-gray-200" 
                                    src={selectedUser.avatar_url} 
                                    alt={selectedUser.username} 
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <UserIcon className="h-5 w-5 text-indigo-500" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{selectedUser.username || '未设置用户名'}</p>
                                <p className="text-xs text-gray-500">用户ID: {selectedUser.id}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* 角色选择 */}
                        <div>
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            设置角色
                          </label>
                          <select
                            id="role"
                            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            value={role}
                            onChange={(e) => setRole(e.target.value as ProjectMember['role'])}
                            disabled={isSubmitting}
                          >
                            <option value="manager">管理员 - 可管理项目和成员</option>
                            <option value="member">成员 - 可参与项目任务</option>
                            <option value="viewer">观察者 - 仅查看权限</option>
                          </select>
                        </div>
                        
                        {/* 错误信息 */}
                        {error && (
                          <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">错误</h3>
                                <div className="mt-2 text-sm text-red-700">
                                  <p>{error}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* 提交按钮 */}
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!userId || isSubmitting || Boolean(error)}
                          >
                            {isSubmitting ? (
                              <span className="flex items-center">
                                <span className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></span>
                                处理中...
                              </span>
                            ) : (
                              '添加成员'
                            )}
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleClose}
                            disabled={isSubmitting}
                          >
                            取消
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

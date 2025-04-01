import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { addProjectMember, type ProjectMember } from '@/lib/api';

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
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectMember['role']>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{id: string, username: string, email: string, avatar_url?: string}>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 模拟搜索用户
  const handleSearch = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // 这里应该调用API搜索用户
      // 暂时使用模拟数据
      const mockResults = [
        { id: '1', username: 'user1', email: 'user1@example.com', avatar_url: 'https://via.placeholder.com/40' },
        { id: '2', username: 'user2', email: 'user2@example.com' },
      ].filter(user => 
        user.username.includes(query) || user.email.includes(query)
      );
      
      setTimeout(() => {
        setSearchResults(mockResults);
        setIsSearching(false);
      }, 500);
    } catch (err) {
      console.error('Error searching users:', err);
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: {id: string, email: string}) => {
    setUserId(user.id);
    setEmail(user.email);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId && !email) {
      setError('请输入用户ID或邮箱地址');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 如果有用户ID，直接添加成员
      if (userId) {
        await addProjectMember(projectId, userId, role);
        
        // 模拟返回的成员数据
        const newMember: ProjectMember = {
          project_id: projectId,
          user_id: userId,
          role: role,
          joined_at: new Date().toISOString(),
          username: email.split('@')[0], // 临时使用
          email: email
        };
        
        onInvite(newMember);
        resetForm();
      } else {
        // 如果只有邮箱，应该发送邀请
        // 暂时不实现，需要后端支持
        setError('目前只支持添加已知用户ID');
      }
    } catch (err) {
      console.error('Error inviting member:', err);
      setError('邀请成员时出错，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setUserId('');
    setEmail('');
    setRole('member');
    setError(null);
    setSearchResults([]);
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
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      邀请项目成员
                    </Dialog.Title>
                    
                    <form onSubmit={handleSubmit} className="mt-4">
                      {error && (
                        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                          {error}
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          搜索用户
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="search"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              handleSearch(e.target.value);
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="输入用户名或邮箱搜索"
                          />
                          {isSearching && (
                            <div className="absolute right-3 top-2">
                              <div className="animate-spin h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                            </div>
                          )}
                          
                          {searchResults.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                              {searchResults.map(user => (
                                <div 
                                  key={user.id}
                                  onClick={() => handleSelectUser(user)}
                                  className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                >
                                  {user.avatar_url ? (
                                    <img 
                                      src={user.avatar_url} 
                                      alt={user.username} 
                                      className="h-8 w-8 rounded-full mr-2"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                      <span className="text-xs font-medium text-gray-500">
                                        {user.username.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm font-medium">{user.username}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                          角色
                        </label>
                        <select
                          id="role"
                          value={role}
                          onChange={(e) => setRole(e.target.value as ProjectMember['role'])}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="admin">管理员</option>
                          <option value="member">成员</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          管理员可以管理项目成员和设置，成员只能参与项目任务。
                        </p>
                      </div>
                      
                      <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={isSubmitting || (!userId && !email)}
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? '添加中...' : '添加成员'}
                        </button>
                        <button
                          type="button"
                          onClick={handleClose}
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        >
                          取消
                        </button>
                      </div>
                    </form>
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

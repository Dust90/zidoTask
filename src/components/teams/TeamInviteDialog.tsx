import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createTeamInvitation, type TeamMember, type TeamInvitation } from '@/lib/api';

interface TeamInviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (member: TeamMember) => void;
  teamId: string;
}

export default function TeamInviteDialog({ 
  isOpen, 
  onClose, 
  onInvite, 
  teamId 
}: TeamInviteDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamInvitation['role']>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('邮箱地址不能为空');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const invitation = await createTeamInvitation(teamId, email.trim(), role);
      
      // 生成邀请链接
      const baseUrl = window.location.origin;
      const inviteUrl = `${baseUrl}/invitations/team?token=${invitation.token}`;
      setInviteLink(inviteUrl);
      
      // 清空表单
      setEmail('');
    } catch (err) {
      console.error('Error creating invitation:', err);
      setError('创建邀请时出错，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setRole('member');
    setError(null);
    setInviteLink(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
        .then(() => {
          alert('邀请链接已复制到剪贴板');
        })
        .catch(err => {
          console.error('无法复制到剪贴板:', err);
        });
    }
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
                      邀请团队成员
                    </Dialog.Title>
                    
                    {inviteLink ? (
                      <div className="mt-4">
                        <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded-md">
                          邀请已创建成功！请将以下链接发送给您要邀请的成员。
                        </div>
                        
                        <div className="mt-2 flex items-center">
                          <input
                            type="text"
                            readOnly
                            value={inviteLink}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={copyToClipboard}
                            className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            复制
                          </button>
                        </div>
                        
                        <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                          <button
                            type="button"
                            onClick={() => setInviteLink(null)}
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:w-auto"
                          >
                            邀请更多成员
                          </button>
                          <button
                            type="button"
                            onClick={handleClose}
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          >
                            完成
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="mt-4">
                        {error && (
                          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                            {error}
                          </div>
                        )}
                        
                        <div className="mb-4">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            邮箱地址 *
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="输入邮箱地址"
                            required
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                            角色
                          </label>
                          <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as TeamInvitation['role'])}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="admin">管理员</option>
                            <option value="member">成员</option>
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            管理员可以管理团队成员和项目，成员只能参与项目。
                          </p>
                        </div>
                        
                        <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? '发送中...' : '发送邀请'}
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
                    )}
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

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { updateTeam, deleteTeam, type Team } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface TeamSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateTeam: (team: Team) => void;
  team: Team;
}

export default function TeamSettingsDialog({ 
  isOpen, 
  onClose, 
  onUpdateTeam,
  team 
}: TeamSettingsDialogProps) {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 当团队数据变化时更新表单
  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description || '');
    }
  }, [team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('团队名称不能为空');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const updatedTeam = await updateTeam(team.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        avatar_url: team.avatar_url
      });
      
      onUpdateTeam(updatedTeam);
    } catch (err) {
      console.error('Error updating team:', err);
      setError('更新团队时出错，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm('确定要删除此团队吗？此操作不可撤销，团队中的所有项目和任务都将被删除。')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await deleteTeam(team.id);
      onClose();
      router.push('/teams');
    } catch (err) {
      console.error('Error deleting team:', err);
      setError('删除团队时出错，请重试');
      setIsDeleting(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
                    onClick={onClose}
                  >
                    <span className="sr-only">关闭</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      团队设置
                    </Dialog.Title>
                    
                    <form onSubmit={handleSubmit} className="mt-4">
                      {error && (
                        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                          {error}
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 mb-1">
                          团队名称 *
                        </label>
                        <input
                          type="text"
                          id="team-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="输入团队名称"
                          required
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="team-description" className="block text-sm font-medium text-gray-700 mb-1">
                          团队描述
                        </label>
                        <textarea
                          id="team-description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="描述这个团队的目标和用途（可选）"
                        />
                      </div>
                      
                      <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? '保存中...' : '保存更改'}
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        >
                          取消
                        </button>
                      </div>
                    </form>
                    
                    <div className="mt-8 pt-5 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-red-600">危险区域</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        删除团队将永久移除所有相关数据，包括项目和任务。此操作不可撤销。
                      </p>
                      <button
                        type="button"
                        onClick={handleDeleteTeam}
                        disabled={isDeleting}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? '删除中...' : '删除团队'}
                      </button>
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

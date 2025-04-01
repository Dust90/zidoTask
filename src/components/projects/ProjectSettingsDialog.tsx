import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { updateProject, deleteProject, type Project } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface ProjectSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject: (project: Project) => void;
  project: Project;
}

export default function ProjectSettingsDialog({ 
  isOpen, 
  onClose, 
  onUpdateProject,
  project 
}: ProjectSettingsDialogProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [dueDate, setDueDate] = useState(project.due_date ? new Date(project.due_date).toISOString().split('T')[0] : '');
  const [status, setStatus] = useState(project.status || 'planning');
  const [color, setColor] = useState(project.color || 'indigo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 当项目数据变化时更新表单
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setDueDate(project.due_date ? new Date(project.due_date).toISOString().split('T')[0] : '');
      setStatus(project.status || 'planning');
      setColor(project.color || 'indigo');
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('项目名称不能为空');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const updatedProject = await updateProject(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        status: status as Project['status'],
        due_date: dueDate || undefined,
        color
      });
      
      onUpdateProject(updatedProject);
    } catch (err) {
      console.error('Error updating project:', err);
      setError('更新项目时出错，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('确定要删除此项目吗？此操作不可撤销，项目中的所有任务都将被删除。')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await deleteProject(project.id);
      onClose();
      router.push(`/teams/${project.team_id}`);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('删除项目时出错，请重试');
      setIsDeleting(false);
    }
  };

  const colorOptions = [
    { value: 'indigo', label: '靛蓝色', class: 'bg-indigo-500' },
    { value: 'red', label: '红色', class: 'bg-red-500' },
    { value: 'green', label: '绿色', class: 'bg-green-500' },
    { value: 'blue', label: '蓝色', class: 'bg-blue-500' },
    { value: 'purple', label: '紫色', class: 'bg-purple-500' },
    { value: 'yellow', label: '黄色', class: 'bg-yellow-500' },
    { value: 'pink', label: '粉色', class: 'bg-pink-500' },
    { value: 'gray', label: '灰色', class: 'bg-gray-500' },
  ];

  const statusOptions = [
    { value: 'planning', label: '规划中' },
    { value: 'in_progress', label: '进行中' },
    { value: 'on_hold', label: '已暂停' },
    { value: 'completed', label: '已完成' },
  ];

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
                      项目设置
                    </Dialog.Title>
                    
                    <form onSubmit={handleSubmit} className="mt-4">
                      {error && (
                        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                          {error}
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">
                          项目名称 *
                        </label>
                        <input
                          type="text"
                          id="project-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="输入项目名称"
                          required
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-1">
                          项目描述
                        </label>
                        <textarea
                          id="project-description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="描述这个项目的目标和范围（可选）"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="project-status" className="block text-sm font-medium text-gray-700 mb-1">
                          项目状态
                        </label>
                        <select
                          id="project-status"
                          value={status}
                          onChange={(e) => setStatus(e.target.value as 'planning' | 'in_progress' | 'on_hold' | 'completed')}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="project-due-date" className="block text-sm font-medium text-gray-700 mb-1">
                          截止日期
                        </label>
                        <input
                          type="date"
                          id="project-due-date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          项目颜色
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {colorOptions.map((option) => (
                            <div 
                              key={option.value}
                              onClick={() => setColor(option.value)}
                              className={`
                                flex items-center justify-center p-2 rounded-md cursor-pointer
                                ${color === option.value ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}
                              `}
                            >
                              <div className={`h-6 w-6 rounded-full ${option.class}`} title={option.label}></div>
                            </div>
                          ))}
                        </div>
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
                        删除项目将永久移除所有相关数据，包括项目任务。此操作不可撤销。
                      </p>
                      <button
                        type="button"
                        onClick={handleDeleteProject}
                        disabled={isDeleting}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? '删除中...' : '删除项目'}
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

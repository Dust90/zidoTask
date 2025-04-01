import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createTask, getProjects, type Task, type Project } from '@/lib/api';

interface TaskCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: Task) => void;
  defaultProjectId?: string;
}

export default function TaskCreateDialog({ 
  isOpen, 
  onClose, 
  onCreateTask,
  defaultProjectId
}: TaskCreateDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState<string>('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // 加载项目列表
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const projectsData = await getProjects();
        setProjects(projectsData);
        
        // 如果没有默认项目ID，但有项目，则设置第一个项目为默认
        if (!defaultProjectId && projectsData.length > 0 && !projectId) {
          setProjectId(projectsData[0].id);
        }
      } catch (err) {
        console.error('Error loading projects:', err);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    if (isOpen) {
      loadProjects();
    }
  }, [isOpen, defaultProjectId, projectId]);

  // 当默认项目ID变化时更新表单
  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('任务标题不能为空');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 处理标签
      const tagList = tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag)
        .map(tag => ({ name: tag }));
      
      const newTask = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        due_date: dueDate || undefined,
        tags: tagList,
        project_id: projectId || undefined
      });
      
      onCreateTask(newTask);
      resetForm();
    } catch (err) {
      console.error('Error creating task:', err);
      setError('创建任务时出错，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('todo');
    setDueDate('');
    setTags('');
    if (!defaultProjectId) {
      setProjectId('');
    }
    setError(null);
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
                      创建新任务
                    </Dialog.Title>
                    
                    <form onSubmit={handleSubmit} className="mt-4">
                      {error && (
                        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                          {error}
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">
                          任务标题 *
                        </label>
                        <input
                          type="text"
                          id="task-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="输入任务标题"
                          required
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-1">
                          任务描述
                        </label>
                        <textarea
                          id="task-description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="描述这个任务的详细内容（可选）"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="task-project" className="block text-sm font-medium text-gray-700 mb-1">
                          所属项目
                        </label>
                        <select
                          id="task-project"
                          value={projectId}
                          onChange={(e) => setProjectId(e.target.value)}
                          disabled={isLoadingProjects || !!defaultProjectId}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">无项目</option>
                          {projects.map(project => (
                            <option key={project.id} value={project.id}>
                              {project.name} {project.team?.name ? `(${project.team.name})` : ''}
                            </option>
                          ))}
                        </select>
                        {isLoadingProjects && (
                          <div className="mt-1 text-xs text-gray-500">
                            加载项目中...
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 mb-1">
                          优先级
                        </label>
                        <select
                          id="task-priority"
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as Task['priority'])}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="low">低</option>
                          <option value="normal">中</option>
                          <option value="high">高</option>
                          <option value="urgent">紧急</option>
                        </select>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="task-status" className="block text-sm font-medium text-gray-700 mb-1">
                          状态
                        </label>
                        <select
                          id="task-status"
                          value={status}
                          onChange={(e) => setStatus(e.target.value as Task['status'])}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="todo">待办</option>
                          <option value="in_progress">进行中</option>
                          <option value="done">已完成</option>
                        </select>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700 mb-1">
                          截止日期
                        </label>
                        <input
                          type="date"
                          id="task-due-date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="task-tags" className="block text-sm font-medium text-gray-700 mb-1">
                          标签
                        </label>
                        <input
                          type="text"
                          id="task-tags"
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="输入标签，用逗号分隔"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          例如：前端,设计,文档
                        </p>
                      </div>
                      
                      <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? '创建中...' : '创建任务'}
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

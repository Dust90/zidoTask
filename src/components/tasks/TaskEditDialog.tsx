import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { updateTask, getProjects } from '@/lib/api';

// 定义一个宽松的任务类型，兼容所有可能的任务类型
interface EditableTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  start_date?: string;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
  cancelled_at?: string;
  cancelled_reason?: string;
  cancelled_by?: string;
  tags: Array<{ name: string; color?: string }>;
  user_id: string;
  username?: string | null;
  avatar_url?: string | null;
  project_id?: string;
  // 其他可能的属性
  [key: string]: any;
}

// 随机颜色生成函数
const getRandomColor = () => {
  const colors = [
    '#F87171', '#FB923C', '#FBBF24', '#A3E635', '#34D399',
    '#22D3EE', '#60A5FA', '#818CF8', '#A78BFA', '#E879F9',
    '#F472B6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

interface SelectOption {
  value: string;
  label: string;
}

interface Project {
  id: string;
  name: string;
}

// 状态选项
const statusOptions: SelectOption[] = [
  { value: 'todo', label: '待办' },
  { value: 'in-progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
];

// 优先级选项
const priorityOptions: SelectOption[] = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' }
];

interface TaskEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: EditableTask | null;
  setTask: (task: EditableTask | null) => void;
  onTaskUpdated: (updatedTask: EditableTask) => void;
}

export default function TaskEditDialog({
  isOpen,
  onOpenChange,
  task,
  setTask,
  onTaskUpdated
}: TaskEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // 加载项目列表
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsList = await getProjects();
        setProjects(projectsList);
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };

    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const updatedTask = await updateTask(task.id, {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        tags: task.tags,
        project_id: task.project_id,
      });

      // 合并 API 返回的数据和原始任务中的额外字段
      const fullUpdatedTask = {
        ...updatedTask,
        ...Object.fromEntries(
          Object.entries(task).filter(([key]) => 
            !['id', 'title', 'description', 'status', 'priority', 'due_date', 'tags', 'created_at', 'updated_at', 'project_id'].includes(key)
          )
        )
      };

      onTaskUpdated(fullUpdatedTask);
      onOpenChange(false);
      setTask(null);
    } catch (err) {
      setError('更新任务时出错');
      console.error('Error updating task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <DialogTitle className="text-lg font-semibold">编辑任务</DialogTitle>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={() => onOpenChange(false)}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {task && (
          <form onSubmit={handleEditTask} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input
                type="text"
                value={task.title || ''}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={task.description || ''}
                onChange={(e) => setTask({ ...task, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={task.start_date ? task.start_date.split('T')[0] : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
              <input
                type="date"
                value={task.due_date ? task.due_date.split('T')[0] : ''}
                onChange={(e) => setTask({ ...task, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={task.status || 'todo'}
                onChange={(e) => setTask({ ...task, status: e.target.value as EditableTask['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              >
                {statusOptions.map((option: SelectOption) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
              <select
                value={task.priority || 'medium'}
                onChange={(e) => setTask({ ...task, priority: e.target.value as EditableTask['priority'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              >
                {priorityOptions.map((option: SelectOption) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属项目</label>
              <select
                value={task.project_id || ''}
                onChange={(e) => setTask({ ...task, project_id: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              >
                <option value="">无所属项目</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: tag.color ? `${tag.color}20` : '#E5E7EB',
                      color: tag.color || '#374151'
                    }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => setTask({
                        ...task,
                        tags: task.tags.filter((_, i) => i !== index)
                      })}
                      className="hover:text-red-500"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="添加标签..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      e.preventDefault();
                      const newTag = {
                        name: e.currentTarget.value,
                        color: getRandomColor()
                      };
                      setTask({
                        ...task,
                        tags: [...task.tags, newTag]
                      });
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="添加标签..."]') as HTMLInputElement;
                    if (input && input.value) {
                      const newTag = {
                        name: input.value,
                        color: getRandomColor()
                      };
                      setTask({
                        ...task,
                        tags: [...task.tags, newTag]
                      });
                      input.value = '';
                    }
                  }}
                >
                  添加
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isSubmitting ? '保存中...' : '保存修改'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

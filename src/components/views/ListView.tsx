import { useState, useEffect } from 'react';
import { CheckIcon, ClockIcon, FlagIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  TrashIcon, 
  PencilIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { useFilters } from '@/contexts/FilterContext';
import { getTasks, updateTask, deleteTask, type Task as ApiTask } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TaskEditDialog from '@/components/tasks/TaskEditDialog';

// 扩展 API 的 Task 类型
interface Task extends Omit<ApiTask, 'username' | 'avatar_url'> {
  username?: string;
  avatar_url?: string;
}

export default function ListView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'created' | 'due' | 'priority'>('created');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | 'all'>('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { statusFilter: contextStatusFilter, priorityFilter: contextPriorityFilter, sortBy: contextSortBy } = useFilters();

  // 使用上下文中的过滤器作为初始值
  useEffect(() => {
    setStatusFilter(contextStatusFilter as Task['status'] | 'all');
    setPriorityFilter(contextPriorityFilter as Task['priority'] | 'all');
    setSortBy(contextSortBy as 'created' | 'due' | 'priority');
  }, [contextStatusFilter, contextPriorityFilter, contextSortBy]);

  // 加载任务数据
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getTasks();
        setTasks(data);
      } catch (err) {
        console.error('Error loading tasks:', err);
        setLoadError('加载任务时出错');
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  // 切换任务状态
  const handleStatusToggle = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    try {
      await updateTask(taskId, { status: newStatus });
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // 打开编辑对话框
  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  // 处理任务更新
  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  // 打开删除对话框
  const openDeleteDialog = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };

  // 删除任务
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await deleteTask(taskToDelete.id);
      setTasks(tasks.filter(task => task.id !== taskToDelete.id));
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('删除任务时出错');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 视图切换函数
  const onViewChange = (view: string) => {
    router.push(`/${view}`);
  };

  // 处理排序变更
  const handleSortChange = (newSortBy: 'created' | 'due' | 'priority') => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  };

  // 过滤和排序任务
  const filteredTasks = tasks
    .filter(task => {
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let result = 0;
      switch (sortBy) {
        case 'due':
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          result = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          result = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        }
        default:
          result = new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      }
      return sortDirection === 'asc' ? result : -result;
    });

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 列表头部 */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-gray-900">任务列表</h2>
          <div className="ml-4 flex space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Task['status'] | 'all')}
              className="rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">所有状态</option>
              <option value="todo">待办</option>
              <option value="in-progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Task['priority'] | 'all')}
              className="rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">所有优先级</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => onViewChange('dashboard')}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mr-4"
          >
            返回仪表盘
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">排序：</span>
            <button
              onClick={() => handleSortChange('created')}
              className={`text-sm flex items-center ${sortBy === 'created' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}
            >
              创建时间
              {sortBy === 'created' && (sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />)}
            </button>
            <button
              onClick={() => handleSortChange('due')}
              className={`text-sm flex items-center ${sortBy === 'due' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}
            >
              截止日期
              {sortBy === 'due' && (sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />)}
            </button>
            <button
              onClick={() => handleSortChange('priority')}
              className={`text-sm flex items-center ${sortBy === 'priority' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}
            >
              优先级
              {sortBy === 'priority' && (sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />)}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 bg-gray-50 p-4 border-b border-gray-200">
        <div className="col-span-6 md:col-span-4 font-medium text-gray-700">任务</div>
        <div className="hidden md:block md:col-span-2 font-medium text-gray-700">截止日期</div>
        <div className="hidden md:block md:col-span-3 font-medium text-gray-700">标签</div>
        <div className="col-span-4 md:col-span-2 font-medium text-gray-700 text-center">状态</div>
        <div className="col-span-2 md:col-span-1 font-medium text-gray-700 text-right">操作</div>
      </div>

      {/* 加载状态 */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载任务中...</p>
        </div>
      ) : loadError ? (
        <div className="text-center py-8 text-red-600">{loadError}</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无任务</div>
      ) : (
        /* 任务列表 */
        <div className="divide-y divide-gray-200">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`grid grid-cols-12 p-4 items-center hover:bg-gray-50 ${
                task.status === 'completed' ? 'opacity-70' : ''
              }`}
            >
              <div className="col-span-6 md:col-span-4 flex items-center">
                <input
                  type="checkbox"
                  checked={task.status === 'completed'}
                  onChange={() => handleStatusToggle(task.id, task.status)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <div>
                  <div className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </div>
                  <div className="text-sm text-gray-500 md:hidden">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '无截止日期'}
                  </div>
                  {task.username && (
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      {task.avatar_url ? (
                        <img src={task.avatar_url} alt={task.username} className="w-4 h-4 rounded-full mr-1" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-gray-200 mr-1 flex items-center justify-center text-gray-500 text-[10px]">
                          {task.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {task.username}
                    </div>
                  )}
                </div>
              </div>
              <div className="hidden md:block md:col-span-2 text-gray-600">
                {task.due_date ? new Date(task.due_date).toLocaleDateString() : '无截止日期'}
              </div>
              <div className="hidden md:block md:col-span-3">
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}20` : '#E5E7EB',
                        color: tag.color || '#374151'
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-4 md:col-span-2 text-center">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  task.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : task.status === 'in-progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {task.status === 'completed'
                    ? '已完成'
                    : task.status === 'in-progress'
                    ? '进行中'
                    : '待办'}
                </span>
              </div>
              <div className="col-span-2 md:col-span-1 text-right flex justify-end space-x-2">
                <button
                  onClick={() => openEditDialog(task)}
                  className="text-gray-500 hover:text-indigo-600"
                  title="编辑任务"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => openDeleteDialog(task)}
                  className="text-gray-500 hover:text-red-600"
                  title="删除任务"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 列表底部 */}
      {!isLoading && !loadError && filteredTasks.length > 0 && (
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center rounded-b-lg">
          <div className="text-sm text-gray-600">
            显示 {filteredTasks.length} 个任务
          </div>
        </div>
      )}

      {/* 编辑任务对话框 */}
      <TaskEditDialog 
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={editingTask}
        setTask={(task) => setEditingTask(task as Task | null)}
        onTaskUpdated={(updatedTask) => handleTaskUpdated(updatedTask as Task)}
      />

      {/* 删除任务确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white rounded-2xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <DialogTitle className="text-lg font-semibold">确认删除</DialogTitle>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="py-4">
            <p className="text-gray-700">您确定要删除这个任务吗？此操作无法撤销。</p>
          </div>
          
          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 rounded">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 mt-4">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
              onClick={handleDeleteTask}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  处理中...
                </>
              ) : (
                '确认删除'
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

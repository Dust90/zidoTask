import { useState, useEffect } from 'react';
import { getTasks, updateTaskStatus, deleteTask, type Task } from '@/lib/api';
import { CheckCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TaskListProps {
  projectId?: string;
  tasks?: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: (updatedTask: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  showProjectColumn?: boolean;
}

export default function TaskList({ 
  projectId, 
  tasks: propTasks, 
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
  showProjectColumn = true
}: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    // 如果提供了 tasks 属性，直接使用
    if (propTasks) {
      setTasks(propTasks);
      setLoading(false);
      return;
    }

    // 否则从 API 加载任务
    const loadTasks = async () => {
      setLoading(true);
      try {
        const tasksData = await getTasks(projectId);
        setTasks(tasksData);
        setError(null);
      } catch (err) {
        console.error('Error loading tasks:', err);
        setError('加载任务时出错，请重试');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [projectId, propTasks]);

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      const updatedTask = { ...tasks.find(task => task.id === taskId)!, status: newStatus };
      
      // 更新本地状态
      setTasks(tasks.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      
      // 如果提供了回调，调用它
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      // 可以添加错误处理逻辑
    }
  };

  const filteredTasks = tasks.filter(task => {
    // 状态筛选
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }
    
    // 优先级筛选
    if (priorityFilter !== 'all') {
      if (priorityFilter === 'high' && task.priority !== 'high') {
        return false;
      }
      if (priorityFilter === 'medium' && task.priority !== 'medium') {
        return false;
      }
      if (priorityFilter === 'low' && task.priority !== 'low') {
        return false;
      }
    }
    
    return true;
  });

  const getPriorityClass = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '未设置';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
      case 'in-progress':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="py-6 px-4 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-2">加载任务中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 px-4 text-center text-red-500">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-primary-600 hover:text-primary-800 underline"
        >
          重试
        </button>
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="py-10 px-4">
        <div className="text-center">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">没有任务</h3>
          <p className="mt-1 text-sm text-gray-500">
            {tasks.length > 0 
              ? '没有符合筛选条件的任务，请尝试调整筛选条件。' 
              : '开始创建新任务来跟踪您的工作进度。'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="border-b border-gray-200 bg-white p-4 sm:flex sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            任务列表
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            共 {filteredTasks.length} 个任务
            {filteredTasks.length !== tasks.length && ` (筛选自 ${tasks.length} 个任务)`}
          </p>
        </div>
        <div className="mt-4 flex sm:ml-4 sm:mt-0">
          <div className="flex space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-32 rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
            >
              <option value="all">全部状态</option>
              <option value="todo">待办</option>
              <option value="in_progress">进行中</option>
              <option value="done">已完成</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="block w-32 rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
            >
              <option value="all">全部优先级</option>
              <option value="high">高优先级</option>
              <option value="medium">中优先级</option>
              <option value="low">低优先级</option>
            </select>
          </div>
        </div>
      </div>
      
      <ul role="list" className="divide-y divide-gray-200">
        {filteredTasks.map((task) => (
          <li 
            key={task.id}
            className="relative bg-white px-4 py-5 hover:bg-gray-50 sm:px-6 cursor-pointer"
            onClick={() => onTaskClick && onTaskClick(task)}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center">
                  <div className="mr-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStatus = task.status === 'completed' ? 'todo' : 'completed';
                        handleStatusChange(task.id, newStatus);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      {getStatusIcon(task.status)}
                    </button>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {task.title}
                    </p>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityClass(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      
                      {task.due_date && (
                        <span className="text-xs text-gray-500">
                          {new Date(task.due_date) > new Date() 
                            ? `${formatDistanceToNow(new Date(task.due_date), { locale: zhCN })}后到期` 
                            : `已过期 ${formatDistanceToNow(new Date(task.due_date), { locale: zhCN, addSuffix: false })}`
                          }
                        </span>
                      )}
                      
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.slice(0, 3).map((tag) => (
                            <span 
                              key={tag.id} 
                              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {task.tags.length > 3 && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                              +{task.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex items-center">
                {showProjectColumn && task.project_id && (
                  <span className="text-xs text-gray-500 mr-2">
                    项目ID: {task.project_id}
                  </span>
                )}
                
                {task.assignee && (
                  <img
                    src={task.assignee.avatar_url || '/default-avatar.png'}
                    alt={task.assignee.username || '用户'}
                    className="h-6 w-6 rounded-full"
                    title={task.assignee.username || '用户'}
                  />
                )}
                
                {onTaskDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定要删除此任务吗？')) {
                        onTaskDelete(task.id);
                      }
                    }}
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

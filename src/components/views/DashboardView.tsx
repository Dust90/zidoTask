import { useState, useEffect } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { PlusIcon, ClockIcon, ChartBarIcon, CalendarIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, UserCircleIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  getProjects,
  type Task as ApiTask, 
  type Tag as ApiTag 
} from '@/lib/api';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import TaskEditDialog from '@/components/tasks/TaskEditDialog';
import { useRouter } from 'next/navigation';

// 修复 Task 接口，确保类型兼容
interface Task extends Omit<ApiTask, 'username' | 'avatar_url'> {
  username?: string | null;
  avatar_url?: string | null;
}

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface Tag {
  name: string;
  color: string;
}

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  status: string;
  onDrop: (taskId: string, newStatus: string) => void;
  onEditTask: (task: Task) => void;
}

interface StatCardProps {
  title: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

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
  { value: 'in_progress', label: '进行中' },
  { value: 'done', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
];

// 优先级选项
const priorityOptions: SelectOption[] = [
  { value: 'low', label: '低' },
  { value: 'normal', label: '中' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' }
];

const StatCard = ({ title, count, icon: Icon, color, bgColor }: StatCardProps) => {
  return (
    <div className={`${bgColor} p-6 rounded-lg shadow-sm`}>
      <div className="flex items-center">
        <div className={`${color} p-3 rounded-full mr-4`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className={`text-2xl font-semibold ${color}`}>{count}</p>
        </div>
      </div>
    </div>
  );
};

const supabase = createClientComponentClient<Database>();

// 获取用户资料的函数
const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
};

// 获取用户资料的函数
const getUserInfo = async (userId: string): Promise<{ username?: string; avatar_url?: string } | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user info:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserInfo:', error);
    return null;
  }
};

const KanbanColumn = ({ title, tasks, status, onDrop, onEditTask }: KanbanColumnProps) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    onDrop(taskId, status);
  };

  return (
    <div
      className="bg-gray-50 rounded-lg p-4"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h4 className="font-medium text-gray-900 mb-4">{title}</h4>
      <div className="space-y-3">
        {tasks.map((task: Task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', task.id);
            }}
            className="bg-white p-3 rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEditTask(task);
            }}
          >
            <div className="text-sm font-medium text-gray-900">{task.title}</div>
            {task.description && (
              <div className="mt-1 text-sm text-gray-500">{task.description}</div>
            )}
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ClockIcon className="h-4 w-4" />
                <span>开始：{task.start_date ? new Date(task.start_date).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CalendarIcon className="h-4 w-4" />
                <span>截止：{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                  ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    task.priority === 'low' ? 'bg-green-100 text-green-800' :
                      'bg-green-100 text-green-800'
                  }`} 
                >
                  {task.priority === 'high' ? '高' :
                    task.priority === 'medium' ? '中' :
                    task.priority === 'low' ? '低' : '低'
                  }
                </span>
              </div>
              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}20` : '#E5E7EB',
                        color: tag.color || '#374151'
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              {task.username && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <UserCircleIcon className="h-4 w-4" />
                  <span>负责人：{task.username}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    start_date: string;
    due_date: string;
    tags: Tag[];
    project_id?: string;
  }>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    start_date: '',
    due_date: '',
    tags: [],
    project_id: undefined,
  });

  const handleTagsChange = (tags: string[]) => {
    setNewTask(prev => ({
      ...prev,
      tags: tags.map(tag => ({ 
        name: tag,
        color: getRandomColor() // 为每个标签生成随机颜色
      }))
    }));
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTask({
      ...newTask,
      tags: newTask.tags.filter(tag => tag.name !== tagToRemove)
    });
  };

  // 生成随机颜色
  const getRandomColor = () => {
    const colors = [
      '#F87171', // red
      '#FB923C', // orange
      '#FBBF24', // amber
      '#34D399', // emerald
      '#60A5FA', // blue
      '#818CF8', // indigo
      '#A78BFA', // violet
      '#F472B6', // pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  
  // 加载项目列表
  const loadProjects = async () => {
    try {
      const projectsList = await getProjects();
      setProjects(projectsList);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await getTasks();
        const tasksWithProfile = await Promise.all(data.map(async task => {
          const profile = await getProfile(task.user_id);
          return {
            ...task,
            username: profile?.username,
            avatar_url: profile?.avatar_url,
          };
        }));
        setTasks(tasksWithProfile);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setLoadError('加载任务失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
    loadProjects(); // 加载项目列表
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setWarning(null);
    try {
      const result = await createTask({
        ...newTask,
        start_date: newTask.start_date || undefined,
        due_date: newTask.due_date || undefined,
      });
      setIsCreateDialogOpen(false);
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        start_date: '',
        due_date: '',
        tags: [],
        project_id: undefined,
      });
      // 添加新创建的任务到列表
      const profile = await getProfile(result.user_id);
      setTasks(prev => [...prev, {
        ...result,
        username: profile?.username,
        avatar_url: profile?.avatar_url,
      }]);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      if (error.message === 'User not authenticated') {
        setError('请先登录后再创建任务');
      } else if (error.message === 'Task title is required') {
        setError('请输入任务标题');
      } else if (error.message === 'Task priority is required') {
        setError('请选择任务优先级');
      } else if (error.message === 'Task status is required') {
        setError('请选择任务状态');
      } else if (error.message === 'Task with this title already exists') {
        setError('已存在相同标题的任务');
      } else {
        setError('创建任务失败，请稍后重试');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? {
        ...updatedTask,
        username: updatedTask.username,
        avatar_url: updatedTask.avatar_url,
      } : task
    ));
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updatedTask = await updateTask(editingTask.id, {
        title: editingTask.title,
        description: editingTask.description,
        status: editingTask.status,
        priority: editingTask.priority,
        due_date: editingTask.due_date,
        tags: editingTask.tags,
      });

      const profile = await getProfile(updatedTask.user_id);
      setTasks(tasks.map(task => 
        task.id === updatedTask.id ? {
          ...updatedTask,
          username: profile?.username,
          avatar_url: profile?.avatar_url,
        } : task
      ));

      setIsEditDialogOpen(false);
      setEditingTask(null);
    } catch (err) {
      setError('更新任务时出错');
      console.error('Error updating task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;

  const handleDrop = (taskId: string, newStatus: string) => {
    // 处理任务拖拽
    console.log('Task dropped:', taskId, 'to', newStatus);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 获取当月天数的辅助函数
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // 填充上个月的日期
    const firstDayOfWeek = firstDay.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // 当前月的日期
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // 填充下个月的日期
    const remainingDays = 42 - days.length; // 保持6行
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  // 生成日历数据
  const days = getDaysInMonth(currentDate);

  const handleEditTagsChange = (tags: string[]) => {
    if (!editingTask) return;
    setEditingTask({
      ...editingTask,
      tags: tags.map(tag => {
        // 查找是否存在相同名称的标签，如果有则保留其颜色
        const existingTag = editingTask.tags.find(t => t.name === tag);
        return {
          name: tag,
          color: existingTag?.color || getRandomColor()
        };
      })
    });
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await deleteTask(deletingTaskId);
      setTasks(tasks.filter(task => task.id !== deletingTaskId));
      setIsDeleteDialogOpen(false);
      setDeletingTaskId(null);
    } catch (err) {
      setError('删除任务时出错');
      console.error('Error deleting task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (taskId: string) => {
    setDeletingTaskId(taskId);
    setIsDeleteDialogOpen(true);
  };

  const router = useRouter();

  const onViewChange = (view: string) => {
    router.push(`/${view}`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* 统计卡片 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">任务统计</h2>
        <button 
          onClick={() => onViewChange('stats')}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          查看详细统计
          <ChartBarIcon className="ml-2 h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总任务"
          count={totalCount}
          icon={ChartBarIcon}
          color="text-primary-500"
          bgColor="bg-primary-50"
        />
        <StatCard
          title="待办任务"
          count={todoCount}
          icon={ClockIcon}
          color="text-yellow-500"
          bgColor="bg-yellow-50"
        />
        <StatCard
          title="进行中"
          count={inProgressCount}
          icon={ChartBarIcon}
          color="text-blue-500"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="已完成"
          count={completedCount}
          icon={CheckIcon}
          color="text-green-500"
          bgColor="bg-green-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 日历视图 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
            </h3>
            <div className="flex space-x-2 items-center">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onViewChange('calendar')}
                className="ml-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                查看完整日历
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <div
                key={day}
                className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700"
              >
                {day}
              </div>
            ))}
            {days.map((day, index) => {
              const isToday = day.date.toDateString() === new Date().toDateString();
              
              // 找出这一天的所有任务
              const dayTasks = tasks.filter(task => {
                if (!task.due_date) return false;
                const taskDate = new Date(task.due_date);
                return taskDate.toDateString() === day.date.toDateString();
              });

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border border-gray-200 ${
                    isToday ? 'bg-indigo-50' : 
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  <div className={`text-sm ${
                    day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayTasks.map((task, taskIndex) => (
                      <TooltipProvider key={taskIndex}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(task);
                              }}
                              className={`text-xs p-1 rounded cursor-pointer ${
                                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                task.priority === 'low' ? 'bg-green-100 text-green-800' :
                                  'bg-green-100 text-green-800'
                              }`}
                            >
                              <div className="truncate">{task.title}</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs">
                              <div className="font-medium">{task.title}</div>
                              {task.description && (
                                <div className="text-xs mt-1 text-gray-500">
                                  {task.description.length > 100
                                    ? `${task.description.substring(0, 100)}...`
                                    : task.description}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 看板预览 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              任务看板
            </h3>
            <button 
              onClick={() => onViewChange('kanban')}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              查看完整看板
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 待办任务 */}
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-700">待办</h4>
                <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                  {tasks.filter(task => task.status === 'todo').length} 个任务
                </span>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {tasks
                  .filter(task => task.status === 'todo')
                  .slice(0, 3)
                  .map(task => (
                    <div 
                      key={task.id}
                      className="bg-white p-2 rounded shadow-sm cursor-pointer hover:bg-gray-50"
                      onClick={() => openEditDialog(task)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-sm truncate">{task.title}</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          task.priority === 'low' ? 'bg-red-100 text-red-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                        </span>
                      </div>
                      {task.due_date && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {new Date(task.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  ))}
                {tasks.filter(task => task.status === 'todo').length > 3 && (
                  <div 
                    className="text-center text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer pt-1"
                    onClick={() => onViewChange('kanban')}
                  >
                    查看更多 ({tasks.filter(task => task.status === 'todo').length - 3} 个)
                  </div>
                )}
              </div>
            </div>

            {/* 进行中任务 */}
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-700">进行中</h4>
                <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                  {tasks.filter(task => task.status === 'in-progress').length} 个任务
                </span>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {tasks
                  .filter(task => task.status === 'in-progress')
                  .slice(0, 3)
                  .map(task => (
                    <div 
                      key={task.id}
                      className="bg-white p-2 rounded shadow-sm cursor-pointer hover:bg-gray-50"
                      onClick={() => openEditDialog(task)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-sm truncate">{task.title}</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          task.priority === 'low' ? 'bg-green-100 text-green-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                        </span>
                      </div>
                      {task.due_date && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {new Date(task.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  ))}
                {tasks.filter(task => task.status === 'in-progress').length > 3 && (
                  <div 
                    className="text-center text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer pt-1"
                    onClick={() => onViewChange('kanban')}
                  >
                    查看更多 ({tasks.filter(task => task.status === 'in-progress').length - 3} 个)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 最近任务列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900">最近任务</h3>
          <button 
            onClick={() => onViewChange('list')}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            查看所有任务
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="border-t border-gray-200">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
            </div>
          ) : loadError ? (
            <div className="text-center py-4 text-red-600">{loadError}</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-4 text-gray-500">暂无任务</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    优先级
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    负责人
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    截止日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标签
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.slice(0, 5).map((task) => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => openEditDialog(task)}
                        className="hover:text-indigo-600 text-left w-full"
                      >
                        {task.title}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {task.status === 'completed' ? '已完成' :
                          task.status === 'in-progress' ? '进行中' : 
                          task.status === 'cancelled' ? '已取消' : '待办'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          task.priority === 'low' ? 'bg-green-100 text-green-800' :
                            'bg-green-100 text-green-800'
                        }`}
                      >
                        {task.priority === 'high' ? '高' :
                          task.priority === 'medium' ? '中' :
                          task.priority === 'low' ? '紧急' : '低'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.username ? (
                        <div className="flex items-center">
                          {task.avatar_url ? (
                            <img 
                              src={task.avatar_url} 
                              alt={task.username} 
                              className="w-6 h-6 rounded-full mr-2"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-gray-500 text-xs">
                              {task.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="text-sm text-gray-600">{task.username}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        {task.tags.slice(0, 2).map((tag, index) => (
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
                        {task.tags.length > 2 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            +{task.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditDialog(task)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => openDeleteDialog(task.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tasks.length > 5 && (
            <div className="px-6 py-3 text-center">
              <button 
                onClick={() => onViewChange('list')}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                查看更多 ({tasks.length - 5} 个)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 统计视图链接 */}
      <div className="flex justify-end">
        {/* <button 
          onClick={() => onViewChange('stats')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          查看详细统计
          <ChartBarIcon className="ml-2 h-4 w-4" />
        </button> */}
      </div>

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

      {/* 新建任务浮动按钮 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <button 
            className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center transition-transform hover:scale-110"
            aria-label="新建任务"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </DialogTrigger>
        <DialogContent className="bg-white rounded-2xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <DialogTitle className="text-lg font-semibold">新建任务</DialogTitle>
            <DialogTrigger asChild>
              <button className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </DialogTrigger>
          </div>
          
          <form onSubmit={handleCreateTask} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            
            {warning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-600">
                {warning}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">任务名称</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                  value={newTask.start_date ? newTask.start_date.split('T')[0] : ''}
                  onChange={(e) =>
                    setNewTask({ ...newTask, start_date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                  value={newTask.due_date ? newTask.due_date.split('T')[0] : ''}
                  onChange={(e) =>
                    setNewTask({ ...newTask, due_date: e.target.value })
                  }
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={newTask.status}
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Task['status'] })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">所属项目</label>
              <select
                value={newTask.project_id || ''}
                onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value || undefined })}
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
              <div className="flex flex-wrap gap-2">
                {newTask.tags?.map((tag, index) => (
                  <span 
                    key={index} 
                    className="text-xs px-2 py-1 rounded-full flex items-center"
                    style={{
                      backgroundColor: tag.color ? `${tag.color}20` : '#E5E7EB',
                      color: tag.color || '#374151'
                    }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag.name)}
                      className="ml-1 hover:text-red-500"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="输入标签后按回车"
                  className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      const tag = input.value.trim();
                      if (tag && !newTask.tags?.some(t => t.name === tag)) {
                        handleTagsChange([...(newTask.tags?.map(t => t.name) || []), tag]);
                        input.value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setIsCreateDialogOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '创建中...' : '创建'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

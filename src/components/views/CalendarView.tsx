import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { getTasks, type Task as ApiTask } from '@/lib/api';
import { PencilIcon } from '@heroicons/react/24/outline';
import TaskEditDialog from '@/components/tasks/TaskEditDialog';

const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];

// 扩展 API 的 Task 类型
interface Task extends Omit<ApiTask, 'username' | 'avatar_url'> {
  username?: string;
  avatar_url?: string;
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // 加载任务数据
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getTasks();
        setTasks(data);
      } catch (err) {
        console.error('Error loading tasks:', err);
        setError('加载任务时出错');
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

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

  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    // 使用 due_date 或 start_date 匹配日期
    return tasks.filter(task => {
      const dueDate = task.due_date ? task.due_date.split('T')[0] : null;
      const startDate = task.start_date ? task.start_date.split('T')[0] : null;
      return dueDate === dateString || startDate === dateString;
    });
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 处理任务更新
  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  // 打开编辑对话框
  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const days = getDaysInMonth(currentDate);

  // 获取任务优先级对应的样式
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-l-4 border-red-500';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
      case 'low':
        return 'bg-green-100 text-green-800 border-l-4 border-green-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取任务状态对应的样式
  const getStatusStyle = (status: string) => {
    if (status === 'completed') return 'line-through opacity-50';
    return '';
  };

  return (
    <div className="p-6">
      {/* 日历头部 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
        </h2>
        <div className="flex space-x-2">
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
        </div>
      </div>

      {/* 加载状态 */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : (
        /* 日历网格 */
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* 星期标题 */}
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700"
            >
              {day}
            </div>
          ))}

          {/* 日期格子 */}
          {days.map((day, index) => {
            const tasksForDay = getTasksForDate(day.date);
            const isToday = day.date.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-[120px] bg-white p-2 ${
                  !day.isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''
                }`}
              >
                <div className={`flex items-center justify-center h-6 w-6 mb-1 rounded-full
                  ${isToday ? 'bg-indigo-600 text-white' : ''}`}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-1 max-h-[80px] overflow-y-auto">
                  {tasksForDay.map((task) => (
                    <div
                      key={task.id}
                      className={`text-xs p-2 rounded flex justify-between items-center mb-1 cursor-pointer hover:opacity-80 ${getPriorityStyle(task.priority)} ${getStatusStyle(task.status)}`}
                      onClick={() => openEditDialog(task)}
                    >
                      <div className="truncate flex-1">{task.title}</div>
                      <PencilIcon className="h-3 w-3 text-gray-500 hover:text-gray-700 ml-1 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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
    </div>
  );
}

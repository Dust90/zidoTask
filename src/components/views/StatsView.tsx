import { useState, useEffect } from 'react';
import { ChartBarIcon, CheckCircleIcon, ClockIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getTasks, type Task as ApiTask } from '@/lib/api';
import { useRouter } from 'next/navigation';

// 扩展 API 的 Task 类型
interface Task extends Omit<ApiTask, 'username' | 'avatar_url'> {
  username?: string;
  avatar_url?: string;
}

// 标签类型
interface TagCount {
  name: string;
  count: number;
  color: string;
}

export default function StatsView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<{
    labels: string[];
    completed: number[];
    created: number[];
  }>({
    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    completed: [0, 0, 0, 0, 0, 0, 0],
    created: [0, 0, 0, 0, 0, 0, 0]
  });
  
  const router = useRouter();

  // 视图切换函数
  const onViewChange = (view: string) => {
    router.push(`/${view}`);
  };

  // 加载任务数据
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getTasks();
        setTasks(data);
        calculateWeeklyData(data);
      } catch (err) {
        console.error('Error loading tasks:', err);
        setError('加载任务时出错');
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  // 计算每周数据
  const calculateWeeklyData = (taskData: Task[]) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 是周日，1-6 是周一到周六
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // 设置为本周一
    weekStart.setHours(0, 0, 0, 0);

    const weekDays: Date[] = [];
    const completedByDay: number[] = [0, 0, 0, 0, 0, 0, 0];
    const createdByDay: number[] = [0, 0, 0, 0, 0, 0, 0];

    // 生成本周的日期
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push(day);
    }

    // 统计每天完成和创建的任务
    taskData.forEach(task => {
      // 处理创建日期
      if (task.created_at) {
        const createdDate = new Date(task.created_at);
        for (let i = 0; i < 7; i++) {
          if (
            createdDate.getDate() === weekDays[i].getDate() &&
            createdDate.getMonth() === weekDays[i].getMonth() &&
            createdDate.getFullYear() === weekDays[i].getFullYear()
          ) {
            createdByDay[i]++;
            break;
          }
        }
      }

      // 处理完成日期 - 假设任务有 completed_at 字段，如果没有，可以使用 updated_at 和 status 组合判断
      if (task.status === 'completed' && task.updated_at) {
        const completedDate = new Date(task.updated_at);
        for (let i = 0; i < 7; i++) {
          if (
            completedDate.getDate() === weekDays[i].getDate() &&
            completedDate.getMonth() === weekDays[i].getMonth() &&
            completedDate.getFullYear() === weekDays[i].getFullYear()
          ) {
            completedByDay[i]++;
            break;
          }
        }
      }
    });

    setWeeklyData({
      labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      completed: completedByDay,
      created: createdByDay
    });
  };

  // 计算统计数据
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const todoTasks = tasks.filter(task => task.status === 'todo').length;
  const cancelledTasks = tasks.filter(task => task.status === 'cancelled').length;
  
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : '0.0';

  // 按优先级统计
  const tasksByPriority = {
    high: tasks.filter(task => task.priority === 'high').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    low: tasks.filter(task => task.priority === 'low').length
  };

  // 按标签统计
  const tasksByTag: Record<string, TagCount> = {};
  tasks.forEach(task => {
    if (task.tags && task.tags.length > 0) {
      task.tags.forEach(tag => {
        if (!tasksByTag[tag.name]) {
          tasksByTag[tag.name] = { name: tag.name, count: 0, color: tag.color || '#6366F1' };
        }
        tasksByTag[tag.name].count++;
      });
    }
  });

  // 转换为数组并排序
  const tagStats = Object.values(tasksByTag).sort((a, b) => b.count - a.count).slice(0, 5);

  // 获取最大值，用于图表比例
  const maxWeeklyValue = Math.max(
    ...weeklyData.completed,
    ...weeklyData.created,
    1 // 确保至少为 1，避免除以零
  );

  return (
    <div className="p-6">
      {/* 页面标题和导航 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">统计分析</h2>
        <div className="flex space-x-4">
          <button 
            onClick={() => onViewChange('dashboard')}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            返回仪表盘
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : (
        <>
          {/* 概览卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">总任务数</p>
                  <p className="text-2xl font-semibold mt-1">{totalTasks}</p>
                </div>
                <div className="p-3 bg-primary-50 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">已完成</p>
                  <p className="text-2xl font-semibold mt-1">{completedTasks}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">待办任务</p>
                  <p className="text-2xl font-semibold mt-1">{todoTasks}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">完成率</p>
                  <p className="text-2xl font-semibold mt-1">{completionRate}%</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>

          {/* 图表和统计 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* 周进度图表 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">本周进度</h3>
              <div className="h-64">
                {/* 简易图表 */}
                <div className="flex h-48 items-end space-x-2">
                  {weeklyData.labels.map((day, index) => (
                    <div key={day} className="flex-1 flex flex-col items-center">
                      {/* 已完成任务柱形 */}
                      <div 
                        className="w-full bg-green-500 rounded-t"
                        style={{ 
                          height: `${(weeklyData.completed[index] / maxWeeklyValue) * 100}%`,
                          minHeight: weeklyData.completed[index] > 0 ? '4px' : '0'
                        }}
                      ></div>
                      {/* 新建任务柱形 */}
                      <div 
                        className="w-full bg-blue-500 rounded-t mt-1"
                        style={{ 
                          height: `${(weeklyData.created[index] / maxWeeklyValue) * 100}%`,
                          minHeight: weeklyData.created[index] > 0 ? '4px' : '0'
                        }}
                      ></div>
                      <div className="text-xs text-gray-500 mt-2">{day}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-4 space-x-6">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                    <span className="text-sm text-gray-600">已完成</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                    <span className="text-sm text-gray-600">新建</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 任务分布 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">任务状态分布</h3>
              <div className="h-64">
                {/* 简易饼图 */}
                <div className="relative h-48 w-48 mx-auto">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-semibold">{totalTasks}</span>
                    <span className="text-sm text-gray-500 ml-1">总计</span>
                  </div>
                  {/* 这里应该有一个真正的饼图，这里用简化的方式表示 */}
                  <div className="absolute inset-0 border-8 border-yellow-400 rounded-full" style={{ clipPath: 'polygon(50% 50%, 0 0, 0 50%)' }}></div>
                  <div className="absolute inset-0 border-8 border-blue-400 rounded-full" style={{ clipPath: 'polygon(50% 50%, 0 50%, 50% 100%, 100% 50%)' }}></div>
                  <div className="absolute inset-0 border-8 border-green-400 rounded-full" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 0, 50% 0)' }}></div>
                  <div className="absolute inset-0 border-8 border-red-400 rounded-full" style={{ clipPath: 'polygon(50% 50%, 50% 0, 0 0)' }}></div>
                </div>
                <div className="flex flex-col space-y-2 mt-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-400 rounded mr-2"></div>
                    <span className="text-sm text-gray-600">待办：{todoTasks} ({totalTasks > 0 ? ((todoTasks / totalTasks) * 100).toFixed(1) : '0'}%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-400 rounded mr-2"></div>
                    <span className="text-sm text-gray-600">进行中：{inProgressTasks} ({totalTasks > 0 ? ((inProgressTasks / totalTasks) * 100).toFixed(1) : '0'}%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-400 rounded mr-2"></div>
                    <span className="text-sm text-gray-600">已完成：{completedTasks} ({totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0'}%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-400 rounded mr-2"></div>
                    <span className="text-sm text-gray-600">已取消：{cancelledTasks} ({totalTasks > 0 ? ((cancelledTasks / totalTasks) * 100).toFixed(1) : '0'}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 优先级和标签统计 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 优先级分布 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">按优先级分布</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">高优先级</span>
                    <span className="text-sm font-medium text-gray-700">{tasksByPriority.high} 任务</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${totalTasks > 0 ? (tasksByPriority.high / totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">中优先级</span>
                    <span className="text-sm font-medium text-gray-700">{tasksByPriority.medium} 任务</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${totalTasks > 0 ? (tasksByPriority.medium / totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">低优先级</span>
                    <span className="text-sm font-medium text-gray-700">{tasksByPriority.low} 任务</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${totalTasks > 0 ? (tasksByPriority.low / totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 标签统计 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">热门标签</h3>
              {tagStats.length > 0 ? (
                <div className="space-y-4">
                  {tagStats.map(tag => (
                    <div key={tag.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{tag.name}</span>
                        <span className="text-sm font-medium text-gray-700">{tag.count} 任务</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${totalTasks > 0 ? (tag.count / totalTasks) * 100 : 0}%`,
                            backgroundColor: tag.color 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">暂无标签数据</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

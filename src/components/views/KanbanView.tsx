import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ClockIcon, TagIcon, PencilIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getTasks, updateTask, type Task as ApiTask } from '@/lib/api';
import TaskEditDialog from '@/components/tasks/TaskEditDialog';
import { useRouter } from 'next/navigation';

// 扩展 API 的 Task 类型
interface Task extends Omit<ApiTask, 'username' | 'avatar_url'> {
  username?: string;
  avatar_url?: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

export default function KanbanView() {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'todo',
      title: '待办',
      color: 'bg-gray-100',
      tasks: []
    },
    {
      id: 'in-progress',
      title: '进行中',
      color: 'bg-yellow-50',
      tasks: []
    },
    {
      id: 'completed',
      title: '已完成',
      color: 'bg-green-50',
      tasks: []
    },
    {
      id: 'cancelled',
      title: '已取消',
      color: 'bg-red-50',
      tasks: []
    }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
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
        
        // 根据任务状态分配到不同的列
        const newColumns = [...columns];
        
        // 清空所有列的任务
        newColumns.forEach(column => {
          column.tasks = [];
        });
        
        // 将任务分配到对应的列
        data.forEach((task: Task) => {
          const column = newColumns.find(col => col.id === task.status);
          if (column) {
            column.tasks.push(task);
          }
        });
        
        setColumns(newColumns);
      } catch (err) {
        console.error('Error loading tasks:', err);
        setError('加载任务时出错');
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;

    // 如果没有目标（拖拽到看板外）或者目标与源相同，则不做任何操作
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    // 复制当前列状态
    const newColumns = [...columns];
    const sourceColumn = newColumns.find(col => col.id === source.droppableId);
    const destColumn = newColumns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // 从源列中移除任务
    const [movedTask] = sourceColumn.tasks.splice(source.index, 1);
    
    // 更新任务状态
    const updatedTask = { ...movedTask, status: destination.droppableId as Task['status'] };
    
    // 将任务添加到目标列
    destColumn.tasks.splice(destination.index, 0, updatedTask);

    // 更新状态
    setColumns(newColumns);
    
    // 调用 API 更新任务状态
    try {
      await updateTask(updatedTask.id, { status: updatedTask.status });
    } catch (err) {
      console.error('Error updating task status:', err);
      // 如果 API 调用失败，恢复原状态
      const revertColumns = [...columns];
      setColumns(revertColumns);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // 打开编辑对话框
  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };
  
  // 处理任务更新
  const handleTaskUpdated = (updatedTask: Task) => {
    // 更新列中的任务
    const newColumns = [...columns];
    
    // 找到任务所在的列
    let found = false;
    for (const column of newColumns) {
      const taskIndex = column.tasks.findIndex(t => t.id === updatedTask.id);
      if (taskIndex !== -1) {
        // 如果任务状态改变，需要移动到新的列
        if (column.id !== updatedTask.status) {
          // 从当前列中移除
          column.tasks.splice(taskIndex, 1);
          
          // 添加到新列
          const newColumn = newColumns.find(col => col.id === updatedTask.status);
          if (newColumn) {
            newColumn.tasks.push(updatedTask);
          }
        } else {
          // 状态未变，只更新任务内容
          column.tasks[taskIndex] = updatedTask;
        }
        found = true;
        break;
      }
    }
    
    setColumns(newColumns);
  };

  // 格式化日期显示
  const formatDate = (dateString?: string) => {
    if (!dateString) return '无截止日期';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-6">
      {/* 页面标题和导航 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">看板视图</h2>
        <div className="flex space-x-4">
          <button 
            onClick={() => onViewChange('dashboard')}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            返回仪表盘
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </button>
          <button 
            onClick={() => onViewChange('list')}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            切换到列表视图
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </button>
          <button 
            onClick={() => onViewChange('calendar')}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            切换到日历视图
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
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {columns.map(column => (
              <div
                key={column.id}
                className={`rounded-xl shadow-sm overflow-hidden ${column.color}`}
              >
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">{column.title}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    {column.tasks.length} 个任务
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="p-4 min-h-[200px]"
                    >
                      {column.tasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white rounded-lg shadow-sm p-4 mb-3 cursor-move group"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
                                      task.priority
                                    )}`}
                                  >
                                    {task.priority === 'high'
                                      ? '高'
                                      : task.priority === 'medium'
                                      ? '中'
                                      : '低'}
                                  </span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditDialog(task);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                                  >
                                    <PencilIcon className="w-4 h-4 text-gray-500" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {task.description || '无描述'}
                              </p>
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center">
                                  <ClockIcon className="w-4 h-4 mr-1" />
                                  <span>{formatDate(task.due_date)}</span>
                                </div>
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex items-center">
                                    <TagIcon className="w-4 h-4 mr-1" />
                                    <div className="flex space-x-1">
                                      {task.tags.slice(0, 2).map(tag => (
                                        <span
                                          key={tag.name}
                                          className="bg-gray-100 px-2 py-0.5 rounded-full text-xs"
                                          style={{ backgroundColor: tag.color ? tag.color + '20' : undefined }}
                                        >
                                          {tag.name}
                                        </span>
                                      ))}
                                      {task.tags.length > 2 && (
                                        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                                          +{task.tags.length - 2}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {task.username && (
                                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center">
                                  {task.avatar_url ? (
                                    <img 
                                      src={task.avatar_url} 
                                      alt={task.username} 
                                      className="w-5 h-5 rounded-full mr-1"
                                    />
                                  ) : (
                                    <span className="w-5 h-5 rounded-full bg-gray-200 mr-1 flex items-center justify-center text-gray-500 text-xs">
                                      {task.username.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">{task.username}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
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

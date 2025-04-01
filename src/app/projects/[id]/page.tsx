'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  UserGroupIcon, 
  Cog6ToothIcon,
  ChevronLeftIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  getProjectById, 
  getProjectMembers,
  getTasks,
  type Project,
  type ProjectMember,
  type Task
} from '../../../lib/api';
import AppLayout from '../../../components/layout/AppLayout';
import ProjectMembersList from '../../../components/projects/ProjectMembersList';
import TaskList from '../../../components/tasks/TaskList';
import TaskCreateDialog from '../../../components/tasks/TaskCreateDialog';
import ProjectSettingsDialog from '../../../components/projects/ProjectSettingsDialog';
import ProjectInviteDialog from '../../../components/projects/ProjectInviteDialog';

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'members'>('tasks');
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const loadProjectData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 并行加载数据
        const [projectData, membersData, tasksData] = await Promise.all([
          getProjectById(projectId),
          getProjectMembers(projectId),
          getTasks(projectId)
        ]);
        
        setProject(projectData);
        setMembers(membersData);
        setTasks(tasksData);
      } catch (err) {
        console.error('Error loading project data:', err);
        setError('加载项目数据时出错');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectData();
  }, [projectId]);

  const handleCreateTask = async (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
    setIsCreateTaskDialogOpen(false);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleInviteMember = (newMember: ProjectMember) => {
    setMembers(prev => [...prev, newMember]);
    setIsInviteDialogOpen(false);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProject(updatedProject);
    setIsSettingsDialogOpen(false);
  };

  // 判断当前用户是否为项目管理员
  const currentUserRole = members.find(m => 
    m.user_id === (typeof window !== 'undefined' ? localStorage.getItem('userId') : null)
  )?.role;
  
  const isAdmin = currentUserRole === 'manager' || currentUserRole === 'admin';

  // 统计任务完成情况
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 计算项目剩余天数
  const calculateRemainingDays = () => {
    if (!project?.due_date) return null;
    
    const dueDate = new Date(project.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const remainingDays = calculateRemainingDays();

  return (
    <AppLayout>
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : project ? (
          <>
            {/* 项目标题和操作 */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <button
                  onClick={() => router.push(`/teams/${project.team_id}`)}
                  className="mr-4 text-gray-500 hover:text-gray-700"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    {project.team?.name}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                </div>
              </div>
              
              <div className="flex space-x-3">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setIsInviteDialogOpen(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <UserGroupIcon className="h-4 w-4 mr-2" />
                      邀请成员
                    </button>
                    <button
                      onClick={() => setIsSettingsDialogOpen(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-2" />
                      项目设置
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 项目状态卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* 项目进度 */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">项目进度</h3>
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">{completionPercentage}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {completedTasks} / {totalTasks} 任务已完成
                </div>
              </div>
              
              {/* 截止日期 */}
              {project.due_date && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500">截止日期</h3>
                    <ClockIcon className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {new Date(project.due_date).toLocaleDateString()}
                  </div>
                  {remainingDays !== null && (
                    <div className={`text-sm ${
                      remainingDays < 0 ? 'text-red-600' : 
                      remainingDays < 3 ? 'text-orange-500' : 'text-gray-600'
                    }`}>
                      {remainingDays < 0 
                        ? `已逾期 ${Math.abs(remainingDays)} 天` 
                        : remainingDays === 0 
                          ? '今日截止' 
                          : `剩余 ${remainingDays} 天`}
                    </div>
                  )}
                </div>
              )}
              
              {/* 项目成员 */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">项目成员</h3>
                  <UserGroupIcon className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">{members.length}</div>
                <div className="flex -space-x-2 overflow-hidden">
                  {members.slice(0, 5).map((member, index) => (
                    <div key={member.user_id} className="inline-block h-8 w-8">
                      {member.avatar_url ? (
                        <img 
                          className="h-8 w-8 rounded-full ring-2 ring-white" 
                          src={member.avatar_url} 
                          alt={member.username || `成员 ${index + 1}`} 
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center ring-2 ring-white">
                          <span className="text-xs font-medium text-gray-500">
                            {member.username ? member.username.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {members.length > 5 && (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center ring-2 ring-white">
                      <span className="text-xs font-medium text-gray-500">
                        +{members.length - 5}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 项目描述 */}
            {project.description && (
              <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">项目描述</h3>
                <p className="text-gray-600">{project.description}</p>
              </div>
            )}

            {/* 标签页切换 */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`
                    pb-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'tasks' 
                      ? 'border-indigo-500 text-indigo-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  任务
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`
                    pb-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'members' 
                      ? 'border-indigo-500 text-indigo-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  成员 ({members.length})
                </button>
              </nav>
            </div>

            {/* 任务列表 */}
            {activeTab === 'tasks' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">项目任务</h2>
                  <button
                    onClick={() => setIsCreateTaskDialogOpen(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    创建任务
                  </button>
                </div>

                <TaskList 
                  tasks={tasks} 
                  onTaskUpdate={handleTaskUpdate}
                  onTaskDelete={handleTaskDelete}
                  showProjectColumn={false}
                />
              </>
            )}

            {/* 成员列表 */}
            {activeTab === 'members' && (
              <ProjectMembersList 
                members={members} 
                projectId={projectId}
                isAdmin={isAdmin}
                onMembersChange={setMembers}
              />
            )}
          </>
        ) : (
          <div className="text-center py-8 text-red-600">找不到项目信息</div>
        )}
      </div>

      {/* 对话框 */}
      {project && (
        <>
          <TaskCreateDialog
            isOpen={isCreateTaskDialogOpen}
            onClose={() => setIsCreateTaskDialogOpen(false)}
            onCreateTask={handleCreateTask}
            defaultProjectId={projectId}
          />
          
          <ProjectInviteDialog
            isOpen={isInviteDialogOpen}
            onClose={() => setIsInviteDialogOpen(false)}
            onInvite={handleInviteMember}
            projectId={projectId}
          />
          
          <ProjectSettingsDialog
            isOpen={isSettingsDialogOpen}
            onClose={() => setIsSettingsDialogOpen(false)}
            onUpdateProject={handleUpdateProject}
            project={project}
          />
        </>
      )}
    </AppLayout>
  );
}

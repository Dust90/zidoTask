'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  UserGroupIcon, 
  Cog6ToothIcon, 
  FolderIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { 
  getTeamById, 
  getTeamMembers, 
  getProjects,
  type Team,
  type TeamMember,
  type Project
} from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import TeamMembersList from '../../../components/teams/TeamMembersList';
import ProjectCard from '../../../components/projects/ProjectCard';
import ProjectCreateDialog from '../../../components/projects/ProjectCreateDialog';
import TeamInviteDialog from '../../../components/teams/TeamInviteDialog';
import TeamSettingsDialog from '../../../components/teams/TeamSettingsDialog';

export default function TeamDetailsPage({ params }: { params: { id: string } }) {
  const teamId = params.id;
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'members'>('projects');
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const loadTeamData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 并行加载数据
        const [teamData, membersData, projectsData] = await Promise.all([
          getTeamById(teamId),
          getTeamMembers(teamId),
          getProjects(teamId)
        ]);
        
        setTeam(teamData);
        setMembers(membersData);
        setProjects(projectsData);
      } catch (err) {
        console.error('Error loading team data:', err);
        setError('加载团队数据时出错');
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamData();
  }, [teamId]);

  const handleCreateProject = async (newProject: Project) => {
    setProjects(prev => [...prev, newProject]);
    setIsCreateProjectDialogOpen(false);
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const handleInviteMember = (newMember: TeamMember) => {
    setMembers(prev => [...prev, newMember]);
    setIsInviteDialogOpen(false);
  };

  const handleUpdateTeam = (updatedTeam: Team) => {
    setTeam(updatedTeam);
    setIsSettingsDialogOpen(false);
  };

  // 判断当前用户是否为团队管理员
  const currentUserRole = members.find(m => 
    m.user_id === (typeof window !== 'undefined' ? localStorage.getItem('userId') : null)
  )?.role;
  
  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'admin';

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
        ) : team ? (
          <>
            {/* 团队标题和操作 */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/teams')}
                  className="mr-4 text-gray-500 hover:text-gray-700"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center">
                  {team.avatar_url ? (
                    <img 
                      src={team.avatar_url} 
                      alt={team.name} 
                      className="h-10 w-10 rounded-full mr-3"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                  )}
                  <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
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
                      团队设置
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 团队描述 */}
            {team.description && (
              <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <p className="text-gray-600">{team.description}</p>
              </div>
            )}

            {/* 标签页切换 */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`
                    pb-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'projects' 
                      ? 'border-indigo-500 text-indigo-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  项目
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

            {/* 项目列表 */}
            {activeTab === 'projects' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">团队项目</h2>
                  {isAdmin && (
                    <button
                      onClick={() => setIsCreateProjectDialogOpen(true)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      创建项目
                    </button>
                  )}
                </div>

                {projects.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                    <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">还没有项目</h3>
                    <p className="mt-1 text-sm text-gray-500">开始创建您的第一个项目，组织和管理任务。</p>
                    {isAdmin && (
                      <div className="mt-6">
                        <button
                          onClick={() => setIsCreateProjectDialogOpen(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <PlusIcon className="h-5 w-5 mr-2" />
                          创建项目
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                      <ProjectCard 
                        key={project.id} 
                        project={project} 
                        onClick={() => handleProjectClick(project.id)} 
                      />
                    ))}
                    
                    {/* 创建项目卡片 */}
                    {isAdmin && (
                      <div 
                        onClick={() => setIsCreateProjectDialogOpen(true)}
                        className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center h-48 cursor-pointer hover:border-indigo-500 transition-colors"
                      >
                        <PlusIcon className="h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm font-medium text-gray-900">创建新项目</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* 成员列表 */}
            {activeTab === 'members' && (
              <TeamMembersList 
                members={members} 
                teamId={teamId}
                isAdmin={isAdmin}
                onMembersChange={setMembers}
              />
            )}
          </>
        ) : (
          <div className="text-center py-8 text-red-600">找不到团队信息</div>
        )}
      </div>

      {/* 对话框 */}
      {team && (
        <>
          <ProjectCreateDialog
            isOpen={isCreateProjectDialogOpen}
            onClose={() => setIsCreateProjectDialogOpen(false)}
            onCreateProject={handleCreateProject}
            teamId={teamId}
          />
          
          <TeamInviteDialog
            isOpen={isInviteDialogOpen}
            onClose={() => setIsInviteDialogOpen(false)}
            onInvite={handleInviteMember}
            teamId={teamId}
          />
          
          <TeamSettingsDialog
            isOpen={isSettingsDialogOpen}
            onClose={() => setIsSettingsDialogOpen(false)}
            onUpdateTeam={handleUpdateTeam}
            team={team}
          />
        </>
      )}
    </AppLayout>
  );
}

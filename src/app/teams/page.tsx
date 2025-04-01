'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, UserGroupIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { getTeams, type Team } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import TeamCreateDialog from '@/components/teams/TeamCreateDialog';
import TeamCard from '@/components/teams/TeamCard';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const loadTeams = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getTeams();
        setTeams(data);
      } catch (err) {
        console.error('Error loading teams:', err);
        setError('加载团队时出错');
      } finally {
        setIsLoading(false);
      }
    };

    loadTeams();
  }, []);

  const handleCreateTeam = async (newTeam: Team) => {
    setTeams(prev => [...prev, newTeam]);
    setIsCreateDialogOpen(false);
  };

  const handleTeamClick = (teamId: string) => {
    router.push(`/teams/${teamId}`);
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">我的团队</h1>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            创建团队
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : teams.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">还没有团队</h3>
            <p className="mt-1 text-sm text-gray-500">开始创建您的第一个团队，邀请成员协作。</p>
            <div className="mt-6">
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                创建团队
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => (
              <TeamCard 
                key={team.id} 
                team={team} 
                onClick={() => handleTeamClick(team.id)} 
              />
            ))}
            
            {/* 创建团队卡片 */}
            <div 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center h-48 cursor-pointer hover:border-indigo-500 transition-colors"
            >
              <UserPlusIcon className="h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900">创建新团队</p>
            </div>
          </div>
        )}
      </div>

      <TeamCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateTeam={handleCreateTeam}
      />
    </AppLayout>
  );
}

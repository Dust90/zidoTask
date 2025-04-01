import { UserGroupIcon } from '@heroicons/react/24/outline';
import { type Team } from '@/lib/api';

interface TeamCardProps {
  team: Team;
  onClick: () => void;
}

export default function TeamCard({ team, onClick }: TeamCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center mb-4">
        {team.avatar_url ? (
          <img 
            src={team.avatar_url} 
            alt={team.name} 
            className="h-12 w-12 rounded-full mr-4"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
            <UserGroupIcon className="h-6 w-6 text-indigo-600" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
          <p className="text-sm text-gray-500">
            创建于 {team.created_at ? new Date(team.created_at).toLocaleDateString() : '未知日期'}
          </p>
        </div>
      </div>
      
      {team.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{team.description}</p>
      )}
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          {team.owner_id === (typeof window !== 'undefined' ? localStorage.getItem('userId') : null) 
            ? '你是所有者' 
            : '你是成员'}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          <UserGroupIcon className="h-3 w-3 mr-1" />
          团队
        </span>
      </div>
    </div>
  );
}

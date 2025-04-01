import { FolderIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { type Project } from '@/lib/api';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  // 计算项目剩余天数
  const calculateRemainingDays = () => {
    if (!project.due_date) return null;
    
    const dueDate = new Date(project.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const remainingDays = calculateRemainingDays();

  // 获取项目状态标签
  const getStatusBadge = () => {
    switch (project.status) {
      case 'planning':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            规划中
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            进行中
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            已完成
          </span>
        );
      case 'on_hold':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            已暂停
          </span>
        );
      default:
        return null;
    }
  };

  // 获取项目颜色
  const getProjectColor = () => {
    return project.color || 'indigo';
  };

  const projectColor = getProjectColor();
  const colorClasses: Record<string, { bg: string, text: string, border: string }> = {
    'indigo': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
    'red': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    'green': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    'blue': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    'purple': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    'yellow': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    'pink': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
    'gray': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
  };

  const colorClass = colorClasses[projectColor] || colorClasses.indigo;

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${colorClass.border}`}
    >
      <div className="flex items-center mb-4">
        <div className={`h-10 w-10 rounded-lg ${colorClass.bg} flex items-center justify-center mr-4`}>
          <FolderIcon className={`h-6 w-6 ${colorClass.text}`} />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-500">
            {project.team?.name}
          </p>
        </div>
      </div>
      
      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
      )}
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {getStatusBadge()}
        </div>
        
        {project.due_date && (
          <div className="flex items-center text-xs text-gray-500">
            <ClockIcon className="h-3 w-3 mr-1" />
            {remainingDays !== null && remainingDays < 0 
              ? <span className="text-red-600">已逾期</span>
              : remainingDays === 0
                ? <span className="text-orange-500">今日截止</span>
                : <span>剩余 {remainingDays} 天</span>
            }
          </div>
        )}
      </div>
    </div>
  );
}

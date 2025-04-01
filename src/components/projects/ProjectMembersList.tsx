import { useState } from 'react';
import { UserCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { 
  removeProjectMember, 
  updateProjectMemberRole,
  type ProjectMember 
} from '@/lib/api';

interface ProjectMembersListProps {
  members: ProjectMember[];
  projectId: string;
  isAdmin: boolean;
  onMembersChange: (members: ProjectMember[]) => void;
}

export default function ProjectMembersList({ 
  members, 
  projectId, 
  isAdmin,
  onMembersChange 
}: ProjectMembersListProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 获取当前用户ID
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  // 按角色排序成员
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder: Record<string, number> = { 
      'manager': 0, 
      'admin': 1, 
      'member': 2,
      'viewer': 3
    };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  const handleRoleChange = async (userId: string, newRole: ProjectMember['role']) => {
    if (userId === currentUserId) {
      setError('您不能更改自己的角色');
      return;
    }

    setIsUpdating(userId);
    setError(null);
    
    try {
      await updateProjectMemberRole(projectId, userId, newRole);
      
      // 更新本地成员列表
      const updatedMembers = members.map(member => 
        member.user_id === userId ? { ...member, role: newRole } : member
      );
      
      onMembersChange(updatedMembers);
    } catch (err) {
      console.error('Error updating member role:', err);
      setError('更新成员角色时出错');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (userId === currentUserId) {
      setError('您不能移除自己');
      return;
    }

    if (!window.confirm('确定要移除此成员吗？')) {
      return;
    }

    setIsUpdating(userId);
    setError(null);
    
    try {
      await removeProjectMember(projectId, userId);
      
      // 更新本地成员列表
      const updatedMembers = members.filter(member => member.user_id !== userId);
      onMembersChange(updatedMembers);
    } catch (err) {
      console.error('Error removing member:', err);
      setError('移除成员时出错');
    } finally {
      setIsUpdating(null);
    }
  };

  // 角色显示名称
  const roleNames: Record<string, string> = {
    'manager': '项目经理',
    'admin': '管理员',
    'member': '成员',
    'viewer': '观察者'
  };

  return (
    <div>
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                成员
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                角色
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                加入时间
              </th>
              {isAdmin && (
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedMembers.map((member) => (
              <tr key={member.user_id} className={isUpdating === member.user_id ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {member.avatar_url ? (
                      <img 
                        className="h-10 w-10 rounded-full" 
                        src={member.avatar_url} 
                        alt={member.username || '用户头像'} 
                      />
                    ) : (
                      <UserCircleIcon className="h-10 w-10 text-gray-400" />
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {member.username || '未知用户'}
                        {member.user_id === currentUserId && ' (你)'}
                      </div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isAdmin && member.user_id !== currentUserId && member.role !== 'manager' ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.user_id, e.target.value as ProjectMember['role'])}
                      disabled={isUpdating !== null}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="admin">管理员</option>
                      <option value="member">成员</option>
                      <option value="viewer">观察者</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.role === 'manager' 
                        ? 'bg-purple-100 text-purple-800' 
                        : member.role === 'admin' 
                          ? 'bg-blue-100 text-blue-800' 
                          : member.role === 'member' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {roleNames[member.role]}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '-'}
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {member.role !== 'manager' && member.user_id !== currentUserId && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={isUpdating !== null}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

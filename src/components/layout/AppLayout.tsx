'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { BellIcon, ListBulletIcon, CalendarIcon, ChartBarIcon, ViewColumnsIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ViewType } from '@/components/MobileNavigation';
import { FilterProvider, useFilters } from '@/contexts/FilterContext';
import { useProfile } from '@/hooks/useProfile';

const views = [
  { id: 'dashboard' as ViewType, name: '工作台', icon: ChartBarIcon },
  { id: 'list' as ViewType, name: '列表', icon: ListBulletIcon },
  { id: 'calendar' as ViewType, name: '日历', icon: CalendarIcon },
  { id: 'stats' as ViewType, name: '统计', icon: ChartBarIcon },
  { id: 'kanban' as ViewType, name: '看板', icon: ViewColumnsIcon },
];

export default function AppLayout({
  children,
  showNav = true,
  currentView,
  onViewChange,
  showFilters = false,
}: {
  children: React.ReactNode;
  showNav?: boolean;
  currentView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  showFilters?: boolean;
}) {
  const { user, loading, signOut } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  if (!user && !loading) return null;

  return (
    <FilterProvider>
      <div className="min-h-screen bg-gray-50">
        {showNav && (
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-14">
                <div className="flex items-center space-x-8">
                  <button onClick={() => router.push('/dashboard')} className="text-xl font-semibold text-primary-600 hover:text-primary-700">
                    Zido
                  </button>
                  {showNav && (
                    <div className="hidden sm:flex sm:space-x-8">
                      {views.map((view) => {
                        const Icon = view.icon;
                        return (
                          <button
                            key={view.id}
                            onClick={() => router.push(`/${view.id}`)}
                            className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                              currentView === view.id
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }`}
                          >
                            <Icon className="h-5 w-5 mr-1.5" aria-hidden="true" />
                            {view.name}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => router.push('/teams')}
                        className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                          pathname?.startsWith('/teams')
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                      >
                        <UserGroupIcon className="h-5 w-5 mr-1.5" aria-hidden="true" />
                        团队
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <span className="sr-only">查看通知</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 focus:outline-none">
                        <img
                          src={profile?.avatar_url || 'https://www.gravatar.com/avatar/default?s=200'}
                          alt="头像"
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => router.push('/settings')}>
                        设置
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/teams')}>
                        我的团队
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={signOut}>
                        退出登录
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </nav>
        )}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-4 sm:px-0">
            {showFilters && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* 仅在移动端显示的视图选择器 */}
                    <div className="sm:hidden w-full">
                      <select
                        value={currentView}
                        onChange={(e) => router.push(`/${e.target.value}`)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      >
                        <option value="dashboard">工作台</option>
                        <option value="list">列表</option>
                        <option value="calendar">日历</option>
                        <option value="stats">统计</option>
                        <option value="kanban">看板</option>
                      </select>
                    </div>

                    {/* 筛选器 */}
                    <FilterBar />

                    {/* 看板视图的新建按钮 */}
                    {currentView === 'kanban' && (
                      <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <PlusIcon className="h-4 w-4 mr-1" />
                        新建列
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* 内容区域 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {children}
            </div>
          </div>
        </main>
      </div>
    </FilterProvider>
  );
}

function FilterBar() {
  const { 
    statusFilter, 
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    sortBy,
    setSortBy
  } = useFilters();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-32 rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
          >
            <option value="all">全部状态</option>
            <option value="todo">待办</option>
            <option value="in_progress">进行中</option>
            <option value="done">已完成</option>
          </select>

          {/* 优先级筛选 */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="block w-32 rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
          >
            <option value="all">全部优先级</option>
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>

          {/* 排序 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="block w-32 rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
          >
            <option value="created">创建时间</option>
            <option value="deadline">截止日期</option>
            <option value="priority">优先级</option>
          </select>
        </div>
      </div>
    </div>
  );
}

import {
  ListBulletIcon,
  CalendarIcon,
  ChartBarIcon,
  ViewColumnsIcon
} from '@heroicons/react/24/outline';

type ViewType = 'list' | 'calendar' | 'stats' | 'kanban';

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  const views = [
    { id: 'list', name: '列表', icon: ListBulletIcon },
    { id: 'calendar', name: '日历', icon: CalendarIcon },
    { id: 'stats', name: '统计', icon: ChartBarIcon },
    { id: 'kanban', name: '看板', icon: ViewColumnsIcon },
  ] as const;

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm py-3 mb-6 border-b border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex space-x-2">
            {views.map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onViewChange(id as ViewType)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition
                  ${currentView === id ? 'tab-active' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Icon className="w-5 h-5" />
                <span>{name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Filters */}
        {currentView === 'list' && (
          <div className="flex-1">
            <div className="flex flex-wrap gap-2">
              <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500">
                <option>所有状态</option>
                <option>待办</option>
                <option>进行中</option>
                <option>已完成</option>
              </select>
              <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500">
                <option>所有优先级</option>
                <option>高</option>
                <option>中</option>
                <option>低</option>
              </select>
              <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500">
                <option>排序: 创建时间</option>
                <option>排序: 截止日期</option>
                <option>排序: 优先级</option>
              </select>
            </div>
          </div>
        )}

        {currentView === 'calendar' && (
          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <span className="font-medium">2023年11月</span>
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
            <button className="px-3 py-1 text-sm bg-gray-100 rounded-lg">
              今天
            </button>
          </div>
        )}

        {currentView === 'kanban' && (
          <div className="flex items-center space-x-3">
            <button className="px-3 py-1 text-sm bg-primary-100 text-primary-600 rounded-lg">
              <PlusIcon className="w-4 h-4 inline-block mr-1" />
              新建列
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Additional icons
function ChevronLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

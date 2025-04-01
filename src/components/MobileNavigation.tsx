import {
  ListBulletIcon,
  CalendarIcon,
  ChartBarIcon,
  ViewColumnsIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export type ViewType = 'list' | 'calendar' | 'stats' | 'kanban' | 'dashboard';

interface MobileNavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const views = [
  { id: 'list' as ViewType, name: '列表', icon: ListBulletIcon },
  { id: 'calendar' as ViewType, name: '日历', icon: CalendarIcon },
  { id: 'stats' as ViewType, name: '统计', icon: ChartBarIcon },
  { id: 'kanban' as ViewType, name: '看板', icon: ViewColumnsIcon },
];

export default function MobileNavigation({ currentView, onViewChange }: MobileNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-4">
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`flex flex-col items-center py-3 ${
                currentView === view.id
                  ? 'text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs mt-1">{view.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

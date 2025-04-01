import { PlusIcon } from '@heroicons/react/24/outline';

export default function WelcomeBanner() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* 欢迎消息 */}
      <div className="col-span-4 bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">欢迎回来，用户</h2>
            <p className="text-gray-600">这是你今天的任务概览</p>
          </div>
          <button className="mt-4 md:mt-0 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>新建任务</span>
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-gray-500 text-sm mb-1">今日待办</div>
        <div className="text-2xl font-semibold text-gray-900">8</div>
        <div className="text-xs text-green-500 mt-1">
          <span className="font-medium">↑3</span> vs 昨天
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-gray-500 text-sm mb-1">进行中</div>
        <div className="text-2xl font-semibold text-gray-900">3</div>
        <div className="text-xs text-red-500 mt-1">
          <span className="font-medium">↓2</span> vs 昨天
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-gray-500 text-sm mb-1">已完成</div>
        <div className="text-2xl font-semibold text-gray-900">12</div>
        <div className="text-xs text-green-500 mt-1">
          <span className="font-medium">↑5</span> vs 昨天
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-gray-500 text-sm mb-1">完成率</div>
        <div className="text-2xl font-semibold text-gray-900">85%</div>
        <div className="text-xs text-green-500 mt-1">
          <span className="font-medium">↑12%</span> vs 昨天
        </div>
      </div>
    </div>
  );
}

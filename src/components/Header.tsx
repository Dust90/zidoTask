'use client';

import { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import ProfileModal from './ProfileModal';

export default function Header() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 mb-6">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
              <i className="fas fa-tasks text-white"></i>
            </div>
            <span className="text-xl font-bold text-gray-800">ZenTask</span>
          </div>

          {/* 右侧工具栏 */}
          <div className="flex items-center space-x-4">
            {/* 通知 */}
            <button className="p-2 text-gray-500 hover:text-primary-600 relative">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* 用户头像 */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-primary-500 to-purple-600 flex items-center justify-center text-white font-medium cursor-pointer hover:opacity-90"
            >
              U
            </button>
          </div>
        </div>
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
}

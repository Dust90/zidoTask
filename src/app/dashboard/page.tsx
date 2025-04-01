'use client';

import DashboardView from '@/components/views/DashboardView';
import AppLayout from '@/components/layout/AppLayout';

export default function DashboardPage() {
  return (
    <AppLayout currentView="dashboard">
      <DashboardView />
    </AppLayout>
  );
}

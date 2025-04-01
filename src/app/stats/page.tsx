'use client';

import StatsView from '@/components/views/StatsView';
import AppLayout from '@/components/layout/AppLayout';

export default function StatsPage() {
  return (
    <AppLayout currentView="stats">
      <StatsView />
    </AppLayout>
  );
}

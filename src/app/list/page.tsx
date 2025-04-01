'use client';

import ListView from '@/components/views/ListView';
import AppLayout from '@/components/layout/AppLayout';

export default function ListPage() {
  return (
    <AppLayout showFilters currentView="list">
      <ListView />
    </AppLayout>
  );
}

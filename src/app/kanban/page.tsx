'use client';

import KanbanView from '@/components/views/KanbanView';
import AppLayout from '@/components/layout/AppLayout';

export default function KanbanPage() {
  return (
    <AppLayout currentView="kanban">
      <KanbanView />
    </AppLayout>
  );
}

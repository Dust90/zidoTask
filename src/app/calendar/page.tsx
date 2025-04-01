'use client';

import CalendarView from '@/components/views/CalendarView';
import AppLayout from '@/components/layout/AppLayout';

export default function CalendarPage() {
  return (
    <AppLayout currentView="calendar">
      <CalendarView />
    </AppLayout>
  );
}

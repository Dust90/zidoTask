import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'default';

interface ToastState {
  open: boolean;
  title: string;
  description?: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    title: '',
    description: '',
    type: 'default',
  });

  const showToast = useCallback(
    (title: string, description?: string, type: ToastType = 'default') => {
      setToast({ open: true, title, description, type });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}

'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/lib/utils';

type Toast = { id: number; title: string; description?: string; variant?: 'default' | 'destructive' };

const ToastContext = React.createContext<{ push: (t: Omit<Toast, 'id'>) => void } | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <Toaster>');
  return ctx;
}

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const push = React.useCallback((t: Omit<Toast, 'id'>) => {
    setToasts((curr) => [...curr, { ...t, id: Date.now() + Math.random() }]);
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      <ToastPrimitive.Provider duration={5_000} swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            onOpenChange={(open) => {
              if (!open) setToasts((curr) => curr.filter((x) => x.id !== t.id));
            }}
            className={cn(
              'pointer-events-auto fixed bottom-4 right-4 z-50 grid w-[360px] grid-cols-[auto_max-content] items-start gap-x-4 rounded-lg border bg-card p-4 text-card-foreground shadow-lg',
              t.variant === 'destructive' && 'border-destructive text-destructive-foreground',
            )}
          >
            <div>
              <ToastPrimitive.Title className="text-sm font-semibold">{t.title}</ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="mt-1 text-xs text-muted-foreground">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close className="rounded p-1 text-muted-foreground hover:text-foreground">
              ✕
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-md" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

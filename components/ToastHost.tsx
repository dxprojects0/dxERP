import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { onToast, ToastPayload } from '../utils/toast';

type ToastItem = ToastPayload & { id: string };

const ToastHost: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return onToast((payload) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const next: ToastItem = {
        id,
        message: payload.message,
        variant: payload.variant || 'info',
        durationMs: payload.durationMs || 2200,
      };
      setToasts((prev) => [...prev, next]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, next.durationMs);
    });
  }, []);

  const iconMap = useMemo(
    () => ({
      success: <CheckCircle2 size={16} />,
      error: <AlertTriangle size={16} />,
      info: <Info size={16} />,
    }),
    [],
  );

  return (
    <div className="fixed z-[120] top-20 right-3 md:right-6 space-y-2 w-[calc(100%-24px)] max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto border rounded-xl px-3 py-2 text-sm bg-surface shadow-lg flex items-center gap-2 ${
            toast.variant === 'success'
              ? 'border-[color:var(--primary)] text-app bg-[color:var(--primary)]/12'
              : toast.variant === 'error'
                ? 'border-[color:var(--primary)] text-app bg-[color:var(--primary)]/16'
                : 'border-app text-app'
          }`}
        >
          {iconMap[toast.variant || 'info']}
          <span className="leading-snug">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export default ToastHost;

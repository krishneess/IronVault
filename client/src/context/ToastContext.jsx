import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: <CircleCheck size={20} className="text-success" />,
  error: <CircleX size={20} className="text-danger" />,
  warning: <TriangleAlert size={20} className="text-warning" />,
  info: <Info size={20} className="text-gold" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, title, message, duration = 4500) => {
      const id = ++idRef.current;
      setToasts((list) => [...list.slice(-4), { id, type, title, message }]);
      if (duration) setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (title, message) => push('success', title, message),
      error: (title, message) => push('error', title, message, 6500),
      warning: (title, message) => push('warning', title, message),
      info: (title, message) => push('info', title, message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="iv-toast-stack" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`iv-toast ${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
            <span className="mt-1">{ICONS[t.type]}</span>
            <div className="flex-grow-1">
              <div className="iv-toast-title">{t.title}</div>
              {t.message && <div className="iv-toast-msg">{t.message}</div>}
            </div>
            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

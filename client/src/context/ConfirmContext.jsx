import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { TriangleAlert, Info } from 'lucide-react';

const ConfirmContext = createContext(null);

/**
 * Promise-based confirmation dialog for destructive or important actions:
 *   const confirm = useConfirm();
 *   if (await confirm({ title, message, confirmText: 'Delete', variant: 'danger' })) { ... }
 */
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);
  const confirmBtnRef = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolverRef.current = resolve;
        setDialog({ confirmText: 'Confirm', cancelText: 'Cancel', variant: 'danger', ...options });
      }),
    []
  );

  const close = useCallback((result) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setDialog(null);
  }, []);

  useEffect(() => {
    if (!dialog) return undefined;
    confirmBtnRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, close]);

  const danger = dialog?.variant === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="iv-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
          <div className="iv-modal p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
            <div className="d-flex gap-3 align-items-start">
              <div className={`stat-icon flex-shrink-0 ${danger ? 'text-danger' : ''}`} style={danger ? { background: 'rgba(229,96,77,.1)', borderColor: 'rgba(229,96,77,.3)' } : undefined}>
                {danger ? <TriangleAlert size={20} /> : <Info size={20} />}
              </div>
              <div>
                <h2 id="confirm-title" className="h5 mb-2">{dialog.title}</h2>
                <p className="text-muted-iv mb-0" style={{ fontSize: '.92rem' }}>{dialog.message}</p>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-ghost" onClick={() => close(false)}>
                {dialog.cancelText}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                className={`btn ${danger ? 'btn-danger' : 'btn-gold'}`}
                onClick={() => close(true)}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}

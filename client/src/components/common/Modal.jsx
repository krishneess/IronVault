import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** Accessible modal dialog. Closes on Escape and backdrop click (unless `busy`). */
export default function Modal({ open, title, subtitle, onClose, children, footer, size = 'md', busy = false }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector('input, select, textarea, button')?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div className="iv-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div
        ref={panelRef}
        className={`iv-modal ${size === 'lg' ? 'iv-modal-lg' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="iv-modal-title"
        style={{ maxHeight: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column' }}
      >
        <div className="iv-card-header">
          <div>
            <h2 id="iv-modal-title" className="iv-card-title" style={{ fontSize: '1.1rem' }}>{title}</h2>
            {subtitle && <div className="text-muted-iv" style={{ fontSize: '.82rem' }}>{subtitle}</div>}
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} disabled={busy} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <div className="iv-card-body" style={{ overflowY: 'auto' }}>{children}</div>
        {footer && <div className="d-flex justify-content-end gap-2 px-4 pb-4 pt-1">{footer}</div>}
      </div>
    </div>
  );
}

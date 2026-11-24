import { Inbox, RefreshCw, CircleAlert } from 'lucide-react';

export function Spinner({ small = false, className = '' }) {
  return <span className={`iv-spinner d-inline-block ${small ? 'iv-spinner-sm' : ''} ${className}`} role="status" aria-label="Loading" />;
}

export function PageLoader({ label = 'Loading…', fullscreen = false }) {
  return (
    <div className={`page-loader ${fullscreen ? 'fullscreen' : ''}`}>
      <div className="d-flex flex-column align-items-center gap-3">
        <Spinner />
        <span style={{ fontSize: '.88rem' }}>{label}</span>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={26} />
      </div>
      <h3 className="h6 text-light mb-1">{title}</h3>
      {message && <p className="mb-0 mx-auto" style={{ maxWidth: 380, fontSize: '.88rem' }}>{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" style={{ color: 'var(--iv-danger)', borderColor: 'rgba(229,96,77,.35)', background: 'rgba(229,96,77,.08)' }}>
        <CircleAlert size={26} />
      </div>
      <h3 className="h6 text-light mb-1">Could not load data</h3>
      <p className="mb-0" style={{ fontSize: '.88rem' }}>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-outline-gold btn-sm mt-3" onClick={onRetry}>
          <RefreshCw size={15} /> Try again
        </button>
      )}
    </div>
  );
}

export function SubmitButton({ loading, children, loadingText = 'Please wait…', className = 'btn-gold', ...props }) {
  return (
    <button type="submit" className={`btn ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? (
        <>
          <Spinner small /> {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

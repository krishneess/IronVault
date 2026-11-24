import { initials, ROLE_LABELS } from '../../utils/format';

export function Avatar({ name, size = 'md' }) {
  return (
    <span className={`iv-avatar ${size === 'lg' ? 'iv-avatar-lg' : ''}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function Badge({ variant = 'gold', children, icon: Icon }) {
  return (
    <span className={`iv-badge iv-badge-${variant}`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

export function RoleBadge({ role }) {
  const variant = role === 'admin' ? 'gold' : role === 'trainer' ? 'info' : 'muted';
  return <Badge variant={variant}>{ROLE_LABELS[role] || role}</Badge>;
}

export function StatusBadge({ active }) {
  return <Badge variant={active ? 'success' : 'danger'}>{active ? 'Active' : 'Inactive'}</Badge>;
}

export function Card({ title, subtitle, actions, children, className = '', bodyClassName = '', noPadding = false }) {
  return (
    <section className={`iv-card ${className}`}>
      {(title || actions) && (
        <header className="iv-card-header">
          <div>
            {title && <h2 className="iv-card-title">{title}</h2>}
            {subtitle && <div className="text-muted-iv" style={{ fontSize: '.8rem' }}>{subtitle}</div>}
          </div>
          {actions && <div className="d-flex gap-2 flex-wrap">{actions}</div>}
        </header>
      )}
      <div className={noPadding ? bodyClassName : `iv-card-body ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function StatCard({ icon: Icon, label, value, hint, loading }) {
  return (
    <div className="iv-card stat-card h-100">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="stat-label">{label}</div>
          {loading ? (
            <div className="skeleton mt-2" style={{ width: 70, height: 30 }} />
          ) : (
            <div className="stat-value">{value}</div>
          )}
        </div>
        {Icon && (
          <div className="stat-icon">
            <Icon size={20} />
          </div>
        )}
      </div>
      {hint && <div className="stat-hint mt-2">{hint}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="d-flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="label">{label}</span>
      <span className="value">{value ?? '—'}</span>
    </div>
  );
}

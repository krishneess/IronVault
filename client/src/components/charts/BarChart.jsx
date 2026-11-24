/**
 * Horizontal bar list in the gold theme – readable on any width, no axis maths needed.
 * data: [{ label, value, display? }]
 */
export default function BarChart({ data = [], emptyText = 'No data for this period', valueFormatter = (v) => v }) {
  const max = Math.max(0, ...data.map((d) => d.value));
  if (!data.length || max === 0) {
    return <div className="text-muted-iv text-center py-4" style={{ fontSize: '.88rem' }}>{emptyText}</div>;
  }
  return (
    <div role="list">
      {data.map((d) => (
        <div key={d.label} role="listitem" className="mb-3">
          <div className="d-flex justify-content-between mb-1" style={{ fontSize: '.85rem' }}>
            <span className="text-truncate me-2">{d.label}</span>
            <span className="fw-semibold text-nowrap">{d.display ?? valueFormatter(d.value)}</span>
          </div>
          <div style={{ height: 10, borderRadius: 10, background: 'var(--iv-surface-3)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.max(2, (d.value / max) * 100)}%`,
                height: '100%',
                borderRadius: 10,
                background: d.value ? 'var(--iv-gold-gradient)' : 'transparent',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Vertical columns for time series (e.g. sign-ups per month). */
export function ColumnChart({ data = [], height = 180 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="d-flex align-items-end gap-2" style={{ height }} role="img" aria-label={data.map((d) => `${d.label}: ${d.value}`).join(', ')}>
      {data.map((d) => (
        <div key={d.label} className="flex-fill d-flex flex-column align-items-center justify-content-end h-100" title={`${d.label}: ${d.value}`}>
          <span className="fw-semibold mb-1" style={{ fontSize: '.72rem' }}>{d.value || ''}</span>
          <div style={{ width: '100%', maxWidth: 36, height: `${(d.value / max) * 100}%`, minHeight: d.value ? 4 : 2, borderRadius: '6px 6px 2px 2px', background: d.value ? 'var(--iv-gold-gradient)' : 'var(--iv-surface-3)' }} />
          <span className="text-muted-iv mt-1" style={{ fontSize: '.68rem' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

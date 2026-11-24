import { Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/format';
import { METRICS, formatMetric } from './metrics';

/** Fitness record history table. Pass onEdit / onDelete to show row actions. */
export default function RecordsTable({ records, onEdit, onDelete }) {
  const actions = Boolean(onEdit || onDelete);
  return (
    <div className="table-responsive">
      <table className="table iv-table table-hover">
        <thead>
          <tr>
            <th>Date</th>
            {METRICS.map((m) => (
              <th key={m.key} className="text-end">{m.label} <span className="text-lowercase">({m.unit})</span></th>
            ))}
            <th>Notes</th>
            {actions && <th className="text-end">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r._id}>
              <td className="text-nowrap fw-semibold">{formatDate(r.recordDate)}</td>
              {METRICS.map((m) => (
                <td key={m.key} className="text-end text-nowrap">
                  {r[m.key] !== undefined && r[m.key] !== null ? formatMetric(r[m.key], m.unit) : <span className="text-muted-iv">—</span>}
                </td>
              ))}
              <td className="text-muted-iv" style={{ maxWidth: 220 }}>
                <span className="d-inline-block text-truncate" style={{ maxWidth: 220 }} title={r.notes}>{r.notes || '—'}</span>
              </td>
              {actions && (
                <td className="text-end text-nowrap">
                  {onEdit && (
                    <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(r)} aria-label={`Edit record from ${formatDate(r.recordDate)}`} title="Edit">
                      <Pencil size={16} />
                    </button>
                  )}
                  {onDelete && (
                    <button type="button" className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => onDelete(r)} aria-label={`Delete record from ${formatDate(r.recordDate)}`} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

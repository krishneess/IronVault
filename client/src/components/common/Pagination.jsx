import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Previous / next pager driven by the API's meta { page, pages, total, limit }. */
export default function Pagination({ meta, onPage }) {
  if (!meta || meta.pages <= 1) {
    return meta ? (
      <div className="px-3 py-2 text-muted-iv" style={{ fontSize: '.82rem' }}>
        {meta.total} result{meta.total === 1 ? '' : 's'}
      </div>
    ) : null;
  }
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 px-3 py-2" style={{ borderTop: '1px solid var(--iv-border-soft)' }}>
      <span className="text-muted-iv" style={{ fontSize: '.82rem' }}>
        {from}–{to} of {meta.total}
      </span>
      <div className="d-flex align-items-center gap-2">
        <button type="button" className="btn btn-ghost btn-sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} aria-label="Previous page">
          <ChevronLeft size={16} /> Prev
        </button>
        <span style={{ fontSize: '.85rem' }}>
          Page {meta.page} / {meta.pages}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)} aria-label="Next page">
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

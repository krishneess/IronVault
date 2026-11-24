import { useMemo, useState } from 'react';
import LineChart from '../charts/LineChart';
import { Card } from '../common/Display';
import { METRICS, RANGES, METRIC_BY_KEY } from './metrics';

/** Historical progress visualisation with metric and time-range selectors. */
export default function ProgressChartCard({ records = [], title = 'Progress history', height = 280 }) {
  const [metric, setMetric] = useState('weight');
  const [range, setRange] = useState('all');

  const points = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days;
    const cutoff = days ? Date.now() - days * 86400000 : null;
    return records
      .filter((r) => !cutoff || new Date(r.recordDate).getTime() >= cutoff)
      .map((r) => ({ date: r.recordDate, value: r[metric] }));
  }, [records, metric, range]);

  const def = METRIC_BY_KEY[metric];

  return (
    <Card
      title={title}
      subtitle={`${def.label} (${def.unit}) over time`}
      actions={
        <select className="form-select form-select-sm" style={{ width: 130 }} value={range} onChange={(e) => setRange(e.target.value)} aria-label="Time range">
          {RANGES.map((r) => (
            <option key={r.key} value={r.key}>{r.label}</option>
          ))}
        </select>
      }
    >
      <div className="d-flex flex-wrap gap-2 mb-3" role="tablist" aria-label="Metric">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={metric === m.key}
            className={`btn btn-sm ${metric === m.key ? 'btn-gold' : 'btn-outline-gold'}`}
            onClick={() => setMetric(m.key)}
          >
            {m.short}
          </button>
        ))}
      </div>
      <LineChart points={points} unit={def.unit} height={height} label={def.label} />
    </Card>
  );
}

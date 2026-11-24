import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

const PAD = { top: 16, right: 16, bottom: 30, left: 44 };

function niceRange(min, max) {
  if (min === max) {
    const pad = Math.abs(min) * 0.05 || 1;
    return [min - pad, max + pad];
  }
  const pad = (max - min) * 0.15;
  return [min - pad, max + pad];
}

const fmtDate = (d) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/**
 * Dependency-free SVG line chart in the IronVault gold style.
 * points: [{ date: Date|string, value: number }] (any order). Hover shows a tooltip.
 */
export default function LineChart({ points = [], unit = '', height = 260, compact = false, label = 'Value' }) {
  const gradientId = useId().replace(/:/g, '');
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => setWidth(Math.max(240, el.clientWidth));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(
    () =>
      points
        .filter((p) => p.value !== undefined && p.value !== null && !Number.isNaN(Number(p.value)))
        .map((p) => ({ date: new Date(p.date), value: Number(p.value) }))
        .sort((a, b) => a.date - b.date),
    [points]
  );

  const pad = compact ? { top: 8, right: 8, bottom: 8, left: 8 } : PAD;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const geometry = useMemo(() => {
    if (!data.length) return null;
    const values = data.map((d) => d.value);
    const [yMin, yMax] = niceRange(Math.min(...values), Math.max(...values));
    const t0 = data[0].date.getTime();
    const t1 = data[data.length - 1].date.getTime();
    const x = (d) => (t1 === t0 ? innerW / 2 : ((d.getTime() - t0) / (t1 - t0)) * innerW);
    const y = (v) => innerH - ((v - yMin) / (yMax - yMin)) * innerH;
    const coords = data.map((d) => ({ ...d, cx: x(d.date), cy: y(d.value) }));
    const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.cx.toFixed(1)},${c.cy.toFixed(1)}`).join(' ');
    const area = `${line} L${coords[coords.length - 1].cx.toFixed(1)},${innerH} L${coords[0].cx.toFixed(1)},${innerH} Z`;
    const yTicks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);
    const step = Math.max(1, Math.ceil(coords.length / Math.max(2, Math.floor(innerW / 90))));
    const xTicks = coords.filter((_, i) => i % step === 0 || i === coords.length - 1);
    return { coords, line, area, yTicks, xTicks, y };
  }, [data, innerW, innerH]);

  if (!geometry) {
    return (
      <div ref={wrapRef} className="d-grid text-muted-iv" style={{ height, placeItems: 'center', fontSize: '.88rem' }}>
        No {label.toLowerCase()} data recorded yet
      </div>
    );
  }

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * width - pad.left;
    let nearest = geometry.coords[0];
    for (const c of geometry.coords) if (Math.abs(c.cx - mx) < Math.abs(nearest.cx - mx)) nearest = c;
    setHover(nearest);
  };

  const decimals = geometry.yTicks[4] - geometry.yTicks[0] < 10 ? 1 : 0;

  return (
    <div ref={wrapRef} className="position-relative" style={{ height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`${label} over time, ${data.length} records`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`line-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9C7A1E" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#F3DE9C" />
          </linearGradient>
        </defs>
        <g transform={`translate(${pad.left},${pad.top})`}>
          {!compact &&
            geometry.yTicks.map((t) => (
              <g key={t}>
                <line x1={0} x2={innerW} y1={geometry.y(t)} y2={geometry.y(t)} stroke="#26262c" strokeDasharray="3 5" />
                <text x={-10} y={geometry.y(t)} dy="0.32em" textAnchor="end" fill="#6c6961" fontSize="11">
                  {t.toFixed(decimals)}
                </text>
              </g>
            ))}
          {!compact &&
            geometry.xTicks.map((c) => (
              <text key={c.date.getTime()} x={c.cx} y={innerH + 20} textAnchor="middle" fill="#6c6961" fontSize="11">
                {fmtDate(c.date)}
              </text>
            ))}
          <path d={geometry.area} fill={`url(#area-${gradientId})`} />
          <path d={geometry.line} fill="none" stroke={`url(#line-${gradientId})`} strokeWidth={compact ? 2 : 2.5} strokeLinejoin="round" strokeLinecap="round" />
          {!compact &&
            geometry.coords.map((c) => (
              <circle key={c.date.getTime() + '-' + c.value} cx={c.cx} cy={c.cy} r={3.5} fill="#0b0b0d" stroke="#D4AF37" strokeWidth="2" />
            ))}
          {hover && (
            <g>
              <line x1={hover.cx} x2={hover.cx} y1={0} y2={innerH} stroke="#D4AF37" strokeOpacity="0.35" />
              <circle cx={hover.cx} cy={hover.cy} r={6} fill="#D4AF37" stroke="#0b0b0d" strokeWidth="2" />
            </g>
          )}
        </g>
      </svg>
      {hover && (
        <div
          className="position-absolute"
          style={{
            left: Math.min(Math.max(hover.cx + pad.left - 60, 0), width - 120),
            top: Math.max(hover.cy + pad.top - 62, 0),
            width: 120,
            pointerEvents: 'none',
            background: '#1c1c21',
            border: '1px solid rgba(212,175,55,.35)',
            borderRadius: 10,
            padding: '.4rem .6rem',
            fontSize: '.78rem',
            boxShadow: '0 8px 24px rgba(0,0,0,.5)',
            textAlign: 'center',
          }}
        >
          <div className="text-muted-iv">{hover.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          <div className="fw-bold text-gold">
            {hover.value} {unit}
          </div>
        </div>
      )}
    </div>
  );
}

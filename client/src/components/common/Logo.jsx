import { Link } from 'react-router-dom';

export function LogoMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="iv-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3DE9C" />
          <stop offset=".5" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#9C7A1E" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#141416" stroke="#2a2a31" />
      <path d="M32 8 52 16v15c0 12.5-8.4 21.6-20 25-11.6-3.4-20-12.5-20-25V16z" fill="none" stroke="url(#iv-logo-g)" strokeWidth="3.5" />
      <path d="M22 28h20M22 36h20M27 22v20M37 22v20" stroke="url(#iv-logo-g)" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ to = '/', size = 34, showTagline = false }) {
  return (
    <Link to={to} className="d-inline-flex align-items-center gap-2 text-decoration-none" aria-label="IronVault home">
      <LogoMark size={size} />
      <span className="d-flex flex-column lh-1">
        <span className="fw-bold" style={{ fontSize: '1.15rem', letterSpacing: '.08em', color: 'var(--iv-text)' }}>
          IRON<span className="text-gold-gradient">VAULT</span>
        </span>
        {showTagline && (
          <span style={{ fontSize: '.6rem', letterSpacing: '.24em', color: 'var(--iv-text-dim)', marginTop: 4 }}>
            FITNESS REPOSITORY
          </span>
        )}
      </span>
    </Link>
  );
}

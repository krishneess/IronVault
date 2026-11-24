import { Link } from 'react-router-dom';
import { ArrowLeft, Dumbbell, LineChart, ShieldCheck } from 'lucide-react';
import Logo from '../common/Logo';
import '../../styles/auth.css';

const FEATURES = [
  { icon: Dumbbell, title: 'Personalised plans', text: 'Workout and diet plans built by your assigned trainer.' },
  { icon: LineChart, title: 'Measurable progress', text: 'Weight, body fat and measurements tracked over time.' },
  { icon: ShieldCheck, title: 'Secure by design', text: 'Encrypted passwords and role-based access on every request.' },
];

export default function AuthLayout({ children, wide = false }) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Logo size={38} showTagline />
        <div>
          <div className="eyebrow mb-3">Gym Fitness Repository</div>
          <h2>
            Strength is built. <span className="text-gold-gradient">Progress is kept.</span>
          </h2>
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="auth-feature">
              <span className="stat-icon flex-shrink-0"><Icon size={19} /></span>
              <div>
                <div className="fw-bold">{title}</div>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-muted-iv position-relative" style={{ fontSize: '.8rem' }}>
          © {new Date().getFullYear()} IronVault
        </div>
      </aside>
      <main className="auth-main">
        <div className={`auth-box ${wide ? 'wide' : ''}`}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="d-lg-none"><Logo size={32} /></span>
            <Link to="/" className="btn btn-ghost btn-sm ms-auto">
              <ArrowLeft size={16} /> Back to home
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

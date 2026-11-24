import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  ChartLine,
  ClipboardList,
  Crown,
  Dumbbell,
  FileBarChart,
  HeartPulse,
  LockKeyhole,
  Menu,
  Salad,
  Scale,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  X,
  CircleCheck,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import Logo, { LogoMark } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';
import TierCards from '../components/membership/TierCards';
import { tierService } from '../services/adminService';
import useApiData from '../hooks/useApiData';
import { roleHome } from '../utils/format';
import '../styles/landing.css';

const MODULES = [
  { icon: Users, label: 'Member Management' },
  { icon: UserCog, label: 'Trainer Management' },
  { icon: Dumbbell, label: 'Workout Plans' },
  { icon: Salad, label: 'Diet Plans' },
  { icon: CreditCard, label: 'Memberships' },
  { icon: ChartLine, label: 'Fitness Records' },
  { icon: FileBarChart, label: 'Reporting' },
];

const ROLES = [
  {
    icon: HeartPulse,
    title: 'Members',
    text: 'Your training, nutrition and progress — kept in one secure place.',
    points: [
      'View your assigned workout plan',
      'Follow your personalised diet plan',
      'Log weight, body fat % and measurements',
      'Track historical progress over time',
      'Check membership status and validity',
      'View your trainer’s profile',
    ],
  },
  {
    icon: Dumbbell,
    title: 'Trainers',
    text: 'Coach with clarity — every client’s plan and progress at hand.',
    featured: true,
    points: [
      'See the members assigned to you',
      'Create and update workout plans',
      'Create and update diet plans',
      'Assign workout and diet plans to members',
      'Monitor each member’s progress history',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Administrators',
    text: 'Run the entire club from a single command centre.',
    points: [
      'Add, manage and deactivate accounts',
      'Configure membership tiers and subscriptions',
      'Allocate trainers to members',
      'Monitor system activity and audit records',
      'Generate operational reports',
    ],
  },
];

const STEPS = [
  { title: 'Join & choose a membership', text: 'Create your member account and select a membership plan that fits your goals.' },
  { title: 'Get matched with a trainer', text: 'An administrator allocates a dedicated trainer based on your needs.' },
  { title: 'Receive your plans', text: 'Your trainer builds and assigns workout and diet plans tailored to you.' },
  { title: 'Log progress, see results', text: 'Record weight, body fat and measurements and watch your history take shape.' },
];

export default function Landing() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const tiers = useApiData(() => tierService.listPublic(), []);

  useEffect(() => {
    document.title = 'IronVault – Gym Fitness Repository Management';
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const primaryCta = user ? (
    <Link to={roleHome(user.role)} className="btn btn-gold btn-lg">
      Go to dashboard <ArrowRight size={18} />
    </Link>
  ) : (
    <Link to="/register" className="btn btn-gold btn-lg">
      Become a member <ArrowRight size={18} />
    </Link>
  );

  return (
    <div className="landing">
      {/* Navigation */}
      <header className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="landing-nav-inner">
            <Logo size={36} showTagline />
            <nav className="landing-links d-none d-lg-flex">
              <a href="#features">Platform</a>
              <a href="#roles">Who it’s for</a>
              <a href="#how">How it works</a>
              <a href="#membership">Membership</a>
              <a href="#plans">Plans</a>
            </nav>
            <div className="d-none d-lg-flex gap-2">
              {user ? (
                <Link to={roleHome(user.role)} className="btn btn-gold">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost">Sign in</Link>
                  <Link to="/register" className="btn btn-gold">Join IronVault</Link>
                </>
              )}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon d-lg-none"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
          {menuOpen && (
            <div className="landing-mobile-menu d-lg-none" onClick={() => setMenuOpen(false)}>
              <a href="#features">Platform</a>
              <a href="#roles">Who it’s for</a>
              <a href="#how">How it works</a>
              <a href="#membership">Membership</a>
              <div className="d-flex gap-2 mt-3">
                {user ? (
                  <Link to={roleHome(user.role)} className="btn btn-gold flex-fill">Dashboard</Link>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-outline-gold flex-fill">Sign in</Link>
                    <Link to="/register" className="btn btn-gold flex-fill">Join</Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="hero-pill">
                <span className="hero-pill-dot"><Sparkles size={13} /></span>
                The premium gym fitness repository
              </span>
              <h1 className="hero-title">
                Every rep, plan and milestone — <span className="text-gold-gradient">secured in the vault.</span>
              </h1>
              <p className="hero-lead">
                IronVault brings members, trainers and administrators onto one platform. Personalised workout and diet
                plans, precise progress tracking and complete membership control — built for clubs that take fitness
                seriously.
              </p>
              <div className="d-flex flex-wrap gap-3 mt-4">
                {primaryCta}
                {!user && (
                  <Link to="/login" className="btn btn-outline-gold btn-lg">
                    Sign in
                  </Link>
                )}
              </div>
              <div className="hero-meta">
                <span><LockKeyhole size={16} /> Encrypted credentials</span>
                <span><ShieldCheck size={16} /> Role-based access</span>
                <span><BadgeCheck size={16} /> Central data repository</span>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="vault-visual" aria-hidden="true">
                <div className="vault-ring r1" />
                <svg className="vault-ring r2" viewBox="0 0 200 200">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <line
                      key={i}
                      x1="100"
                      y1="4"
                      x2="100"
                      y2={i % 5 === 0 ? 14 : 9}
                      stroke={i % 5 === 0 ? '#D4AF37' : '#5b5240'}
                      strokeWidth={i % 5 === 0 ? 1.4 : 0.8}
                      transform={`rotate(${i * 6} 100 100)`}
                    />
                  ))}
                </svg>
                <div className="vault-ring r3" />
                <div className="vault-core">
                  <LogoMark size={64} />
                </div>
                <div className="vault-chip c1">
                  <span className="stat-icon"><Dumbbell size={17} /></span>
                  <span>Workout plans<small>Built by your trainer</small></span>
                </div>
                <div className="vault-chip c2">
                  <span className="stat-icon"><Scale size={17} /></span>
                  <span>Progress logs<small>Weight · Body fat · Measurements</small></span>
                </div>
                <div className="vault-chip c3">
                  <span className="stat-icon"><Crown size={17} /></span>
                  <span>Membership<small>Lifecycle &amp; validity</small></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules strip */}
      <section id="features" className="module-strip">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-center justify-content-lg-between column-gap-4">
            {MODULES.map(({ icon: Icon, label }) => (
              <div key={label} className="module-item">
                <Icon size={18} /> {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="section">
        <div className="container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: 680 }}>
            <div className="eyebrow">One platform · Three roles</div>
            <h2 className="section-title">Built for everyone on the gym floor</h2>
            <p className="section-lead mx-auto">
              Each role gets a dedicated dashboard and permissions enforced on the server — members see their own
              data, trainers see their members, administrators see the whole club.
            </p>
          </div>
          <div className="row g-4">
            {ROLES.map(({ icon: Icon, title, text, points, featured }) => (
              <div key={title} className="col-lg-4">
                <article className={`role-card ${featured ? 'featured' : ''}`}>
                  <div className="role-icon"><Icon size={26} /></div>
                  <h3>{title}</h3>
                  <p className="text-muted-iv mb-0">{text}</p>
                  <ul>
                    {points.map((p) => (
                      <li key={p}><CircleCheck size={16} /> {p}</li>
                    ))}
                  </ul>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="section pt-0">
        <div className="container">
          <div className="row align-items-end mb-5 g-3">
            <div className="col-lg-7">
              <div className="eyebrow">How it works</div>
              <h2 className="section-title mb-0">From sign-up to results in four steps</h2>
            </div>
            <div className="col-lg-5">
              <p className="section-lead mb-0">
                A clear journey for every member, coordinated by trainers and administrators through one central
                repository.
              </p>
            </div>
          </div>
          <div className="row g-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="col-sm-6 col-lg-3">
                <div className="step-card">
                  <div className="step-num text-gold-gradient">0{i + 1}</div>
                  <h4>{step.title}</h4>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership lifecycle */}
      <section id="membership" className="section pt-0">
        <div className="container">
          <div className="iv-card p-4 p-md-5">
            <div className="row g-4 align-items-center">
              <div className="col-lg-5">
                <div className="eyebrow">Membership lifecycle</div>
                <h2 className="section-title">Memberships with a clear, enforced lifecycle</h2>
                <p className="section-lead mb-0">
                  Every subscription moves through defined states. Access to training features follows your
                  membership — active members train, everyone else is guided to renew.
                </p>
              </div>
              <div className="col-lg-7">
                <div className="lifecycle">
                  <span className="lifecycle-state">Created</span>
                  <ChevronRight className="lifecycle-arrow" size={18} />
                  <span className="lifecycle-state">Payment Pending</span>
                  <ChevronRight className="lifecycle-arrow" size={18} />
                  <span className="lifecycle-state active">Active</span>
                  <ChevronRight className="lifecycle-arrow" size={18} />
                  <div className="lifecycle-branch">
                    <span className="lifecycle-state">Suspended</span>
                    <span className="lifecycle-state">Expired</span>
                    <span className="lifecycle-state">Cancelled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership plans (live from the repository) */}
      {tiers.data?.length > 0 && (
        <section id="plans" className="section pt-0">
          <div className="container">
            <div className="text-center mx-auto mb-5" style={{ maxWidth: 640 }}>
              <div className="eyebrow">Membership plans</div>
              <h2 className="section-title">Choose how you train</h2>
              <p className="section-lead mx-auto">Every plan includes your own member dashboard and progress history. Pay at the front desk – no card details online.</p>
            </div>
            <TierCards
              tiers={tiers.data}
              renderAction={(tier, featured) => (
                <Link
                  to={user ? (user.role === 'member' ? '/member/membership' : roleHome(user.role)) : '/register'}
                  className={`btn w-100 mt-3 ${featured ? 'btn-gold' : 'btn-outline-gold'}`}
                >
                  {user ? 'View membership' : `Join with ${tier.name}`}
                </Link>
              )}
            />
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section pt-0">
        <div className="container">
          <div className="cta-panel">
            <div className="eyebrow mb-2">Your strongest chapter starts here</div>
            <h2 className="section-title mx-auto" style={{ maxWidth: 640 }}>
              Unlock the vault and start training with purpose.
            </h2>
            <p className="section-lead mx-auto mb-4">
              Create your member account in under a minute. Your trainer and plans are waiting.
            </p>
            <div className="d-flex justify-content-center flex-wrap gap-3">
              {primaryCta}
              {!user && (
                <Link to="/login" className="btn btn-outline-gold btn-lg">
                  <ClipboardList size={18} /> Staff sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <Logo size={28} />
          <span>© {new Date().getFullYear()} IronVault · Gym Fitness Repository Management System</span>
        </div>
      </footer>
    </div>
  );
}

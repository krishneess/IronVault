import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldAlert } from 'lucide-react';
import Logo from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';
import { roleHome } from '../utils/format';

function StatusPage({ code, icon: Icon, title, message }) {
  const { user } = useAuth();
  useEffect(() => {
    document.title = `${title} · IronVault`;
  }, [title]);
  return (
    <div className="page-loader fullscreen px-3">
      <div className="text-center" style={{ maxWidth: 460 }}>
        <div className="mb-4"><Logo size={36} /></div>
        <div className="empty-state-icon" style={{ width: 76, height: 76 }}><Icon size={32} /></div>
        <div className="font-display text-gold-gradient" style={{ fontSize: '4rem', lineHeight: 1 }}>{code}</div>
        <h1 className="h4 mt-2">{title}</h1>
        <p className="text-muted-iv">{message}</p>
        <div className="d-flex justify-content-center gap-2 mt-3">
          <Link to={user ? roleHome(user.role) : '/'} className="btn btn-gold">
            {user ? 'Go to my dashboard' : 'Back to home'}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function NotFound() {
  return <StatusPage code="404" icon={Compass} title="Page not found" message="The page you are looking for doesn’t exist or has been moved." />;
}

export function Unauthorized() {
  return <StatusPage code="403" icon={ShieldAlert} title="Access restricted" message="Your role does not have permission to view this area." />;
}

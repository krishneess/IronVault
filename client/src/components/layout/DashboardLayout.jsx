import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import { Avatar, RoleBadge } from '../common/Display';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { findNavLabel } from '../../routes/navigation';
import { PageLoader } from '../common/Feedback';

/** Shared dashboard shell for Member, Trainer and Admin – same visual identity, role-specific navigation. */
export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = findNavLabel(user.role, pathname);

  useEffect(() => {
    document.title = `${title} · IronVault`;
  }, [title]);

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log out of IronVault?',
      message: 'You will need to sign in again to access your dashboard.',
      confirmText: 'Log out',
      variant: 'primary',
    });
    if (!ok) return;
    logout();
    toast.info('Logged out', 'See you at your next session.');
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
      <div className="main-area">
        <header className="topbar">
          <button type="button" className="btn btn-ghost btn-icon d-lg-none" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <div className="flex-grow-1 min-w-0">
            <h1 className="topbar-title text-truncate">{title}</h1>
            <div className="topbar-sub d-none d-sm-block">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="topbar-user">
            <div className="d-none d-md-flex flex-column align-items-end lh-sm">
              <span className="fw-semibold" style={{ fontSize: '.85rem' }}>{user.name}</span>
              <RoleBadge role={user.role} />
            </div>
            <Avatar name={user.name} />
          </div>
          <button type="button" className="btn btn-ghost btn-icon d-none d-sm-inline-flex" onClick={handleLogout} aria-label="Log out" title="Log out">
            <LogOut size={19} />
          </button>
        </header>
        <main className="page-content mx-auto">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

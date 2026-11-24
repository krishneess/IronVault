import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import Logo from '../common/Logo';
import { Avatar } from '../common/Display';
import { NAVIGATION } from '../../routes/navigation';
import { ROLE_LABELS, roleHome } from '../../utils/format';

export default function Sidebar({ user, open, onClose, onLogout }) {
  const sections = NAVIGATION[user.role] || [];

  return (
    <>
      <div className={`sidebar-backdrop ${open ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-brand justify-content-between">
          <Logo to={roleHome(user.role)} size={32} showTagline />
          <button type="button" className="btn btn-ghost btn-icon d-lg-none" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-role">
          <Avatar name={user.name} />
          <div className="min-w-0" style={{ minWidth: 0 }}>
            <div className="sidebar-role-label">{ROLE_LABELS[user.role]}</div>
            <div className="sidebar-role-name" title={user.name}>{user.name}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sections.map((section) => (
            <div key={section.section}>
              <div className="sidebar-section">{section.section}</div>
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className="sidebar-link" onClick={onClose}>
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-link w-100 border-0 bg-transparent" onClick={onLogout}>
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

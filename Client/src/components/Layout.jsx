import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Calendar,
  ChevronRight,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Trophy,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar, BrandMark } from './ui';
import { formatLongDate } from '../lib/format';

const CAMPUS_LINKS = [
  { to: '/', label: 'Overview', icon: Home, end: true },
  { to: '/sports', label: 'Sports', icon: Trophy },
  { to: '/schedule', label: 'Schedule', icon: Calendar },
  { to: '/standings', label: 'Standings', icon: TrendingUp },
  { to: '/teams', label: 'Teams', icon: Users },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/sports', label: 'Sports & brackets', icon: Trophy },
  { to: '/admin/matches', label: 'Match control', icon: Calendar },
  { to: '/admin/teams', label: 'Team management', icon: Users },
];

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
    >
      <Icon size={18} strokeWidth={1.9} />
      <span>{item.label}</span>
      <ChevronRight className="nav-link__chev" size={15} />
    </NavLink>
  );
}

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const sidebar = (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <BrandMark />
        <div>
          <strong>WMSU</strong>
          <span>Intramurals</span>
        </div>
        <button
          type="button"
          className="icon-btn sidebar__close"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        >
          <X size={19} />
        </button>
      </div>

      <nav className="sidebar__nav">
        <p className="sidebar__label">Campus</p>
        {CAMPUS_LINKS.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={() => setDrawerOpen(false)} />
        ))}

        {isAdmin && (
          <>
            <p className="sidebar__label sidebar__label--spaced">
              Control room
              <span className="sidebar__tag">Admin</span>
            </p>
            {ADMIN_LINKS.map((item) => (
              <NavItem key={item.to} item={item} onNavigate={() => setDrawerOpen(false)} />
            ))}
          </>
        )}
      </nav>

      <div className="sidebar__foot">
        <div className="season-card">
          <div className="season-card__top">
            <span className="season-card__dot" />
            <span>Season 2026</span>
          </div>
          <p>One campus. Every game. All in one place.</p>
        </div>

        <div className="account-card">
          <Avatar name={user?.full_name} size={38} />
          <div className="account-card__copy">
            <strong>{user?.full_name}</strong>
            <span>{isAdmin ? 'Administrator' : 'Student'}</span>
          </div>
          <button
            type="button"
            className="icon-btn account-card__logout"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="app-shell">
      <div className={`sidebar-wrap${drawerOpen ? ' is-open' : ''}`}>
        {sidebar}
      </div>
      {drawerOpen && (
        <button
          type="button"
          className="drawer-scrim"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        />
      )}

      <div className="app-main">
        <div className="topbar">
          <div className="topbar__left">
            <button
              type="button"
              className="icon-btn topbar__menu"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="topbar__mobile-brand">
              <BrandMark small />
              <span>WMSU Intramurals</span>
            </div>
            <span className="topbar__date">{formatLongDate()}</span>
          </div>
          <div className="topbar__right">
            {isAdmin && (
              <span className="topbar__admin">
                <ShieldCheck size={14} />
                Admin access
              </span>
            )}
            <span className="topbar__season">
              <span className="status-dot" />
              Registration &amp; season live
            </span>
          </div>
        </div>

        <main className="page" key={location.pathname}>
          <Outlet />
        </main>

        <footer className="app-footer">
          <span>WMSU Intramurals · Organized on campus, for campus.</span>
          <span>Season 2026</span>
        </footer>
      </div>
    </div>
  );
}

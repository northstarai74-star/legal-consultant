import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, FilePlus2, FolderOpen, Settings, Menu, X, Sparkles, Plug, Phone } from 'lucide-react';
import Logo from './Logo.jsx';
import { useDocs } from '../context/DocsContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_HREF } from '../lib/support.js';

const NAV = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/new', label: 'New document', icon: FilePlus2 },
  { to: '/documents', label: 'My documents', icon: FolderOpen, count: true },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function AIStatus() {
  const { live, config, apiKey, currentModel } = useSettings();
  if (config.loading) return null;
  if (config.error) {
    return (
      <div className="ai-status ai-status--warn">
        <span className="ai-status__dot" />
        <div>
          <strong>Server unreachable</strong>
          <small>Restart the app and refresh.</small>
        </div>
      </div>
    );
  }
  const local = currentModel?.local;
  return live ? (
    <Link to="/settings" className="ai-status ai-status--live">
      <span className="ai-status__dot" />
      <div>
        <strong>{local ? 'Local AI ready' : 'Claude connected'}</strong>
        <small>{currentModel?.label ?? 'Ready'}{local ? ' · on this computer' : apiKey ? ' · your key' : ''}</small>
      </div>
    </Link>
  ) : (
    <Link to="/settings" className="ai-status ai-status--demo">
      <Plug size={16} aria-hidden />
      <div>
        <strong>Demo mode</strong>
        <small>Start Ollama or connect Claude</small>
      </div>
    </Link>
  );
}

function SupportLink() {
  return (
    <a href={SUPPORT_PHONE_HREF} className="support-link" title={`Customer support: ${SUPPORT_PHONE_DISPLAY}`}>
      <Phone size={16} aria-hidden />
      <div>
        <strong>Customer support</strong>
        <small>{SUPPORT_PHONE_DISPLAY}</small>
      </div>
    </a>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { docs } = useDocs();
  const location = useLocation();
  const flush = location.pathname.startsWith('/doc/');

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className={`shell ${flush ? 'shell--rail' : ''} ${open ? 'shell--open' : ''}`}>
      <header className="mobile-bar no-print">
        <button className="icon-btn" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu size={20} />
        </button>
        <Logo />
        <Link to="/new" className="icon-btn icon-btn--accent" aria-label="New document">
          <Sparkles size={18} />
        </Link>
      </header>

      {open && <div className="scrim no-print" onClick={() => setOpen(false)} />}

      <aside className="sidebar no-print" aria-label="Main navigation">
        <div className="sidebar__top">
          <Link to="/" aria-label="LEGAL LAW landing page" className="sidebar__logo">
            <Logo compact={flush} />
          </Link>
          <button className="icon-btn sidebar__close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <Link to="/new" className="btn btn--primary sidebar__cta" title="New document">
          <Sparkles size={16} aria-hidden />
          <span className="sidebar__label">New document</span>
        </Link>

        <nav className="sidebar__nav">
          {NAV.map(({ to, label, icon: Icon, end, count }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`} title={label}>
              <Icon size={18} aria-hidden />
              <span className="sidebar__label">{label}</span>
              {count && docs.length > 0 && <span className="nav-item__count sidebar__label">{docs.length}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__bottom">
          <AIStatus />
          <SupportLink />
        </div>
      </aside>

      <main className={`main ${flush ? 'main--flush' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}

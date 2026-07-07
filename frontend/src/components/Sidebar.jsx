import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const linkStyle = ({ isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
  background: isActive ? 'var(--bg-panel-raised)' : 'transparent',
  border: isActive ? '1px solid var(--border-hairline)' : '1px solid transparent',
});

// isOpen / onClose control the mobile slide-in drawer. On desktop the
// sidebar is always visible and these props have no visual effect.
export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  // Auto-close the mobile drawer whenever the user navigates to a new page.
  useEffect(() => {
    onClose && onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--status-progress))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: 13,
                color: '#0b1017',
              }}
            >
              T
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>
              TaskFlow
            </span>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <NavLink to="/" end style={linkStyle}>
            Overview
          </NavLink>
          <NavLink to="/tasks" style={linkStyle}>
            {isAdmin ? 'All Tasks' : 'My Tasks'}
          </NavLink>
          <NavLink to="/deadlines" style={linkStyle}>
            Deadline Watch
          </NavLink>
          {isAdmin && (
            <NavLink to="/users" style={linkStyle}>
              Team &amp; Access
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/employee-stats" style={linkStyle}>
              Employee Stats
            </NavLink>
          )}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-hairline-soft)' }}>
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</span>
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: user?.role === 'admin' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {user?.role}
            </span>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '9px 12px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar {
          width: 232px;
          flex-shrink: 0;
          background: var(--bg-panel);
          border-right: 1px solid var(--border-hairline-soft);
          display: flex;
          flex-direction: column;
          padding: 20px 14px;
          height: 100vh;
          position: sticky;
          top: 0;
        }
        .sidebar-close-btn {
          display: none;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          padding: 4px 8px;
        }
        .sidebar-overlay {
          display: none;
        }
        @media (max-width: 900px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            z-index: 210;
            box-shadow: 20px 0 45px rgba(0, 0, 0, 0.45);
          }
          .sidebar-open {
            transform: translateX(0);
          }
          .sidebar-close-btn {
            display: inline-flex;
          }
          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(6, 9, 13, 0.6);
            z-index: 200;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .sidebar { transition: none; }
        }
      `}</style>
    </>
  );
}

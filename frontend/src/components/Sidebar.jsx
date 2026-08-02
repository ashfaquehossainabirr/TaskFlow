import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ActiveTimerBar from './ActiveTimerBar';
import ThemeToggle from './ThemeToggle';
import Modal from './Modal';
import { canManageTasks } from '../utils/roles';
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
export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const isManager = canManageTasks(user?.role);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  useEffect(() => {
    onClose && onClose();
  }, [location.pathname]);
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px 26px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
            }}
          >
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
                color: 'var(--text-on-accent)',
              }}
            >
              T
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: '-0.01em',
              }}
            >
              TaskFlow
            </span>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>

        <nav
          className="sidebar-nav"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <NavLink to="/" end style={linkStyle}>
            Overview
          </NavLink>
          <NavLink to="/projects" style={linkStyle}>
            Projects
          </NavLink>
          <NavLink to="/tasks" style={linkStyle}>
            {isManager ? 'All Tasks' : 'My Tasks'}
          </NavLink>
          <NavLink to="/kanban" style={linkStyle}>
            Kanban Board
          </NavLink>
          <NavLink to="/calendar" style={linkStyle}>
            Calendar
          </NavLink>
          <NavLink to="/deadlines" style={linkStyle}>
            Deadline Watch
          </NavLink>
          <NavLink to="/notes" style={linkStyle}>
            My Notes
          </NavLink>
          {isAdmin && (
            <NavLink to="/users" style={linkStyle}>
              Team &amp; Access
            </NavLink>
          )}
          {isManager && (
            <NavLink to="/employee-stats" style={linkStyle}>
              {isAdmin ? 'Employee Stats' : 'My Team'}
            </NavLink>
          )}
        </nav>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 16,
            borderTop: '1px solid var(--border-hairline-soft)',
            flexShrink: 0,
          }}
        >
          <ActiveTimerBar />
          <div
            style={{
              marginBottom: 10,
            }}
          >
            <ThemeToggle />
          </div>
          <div
            style={{
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              {user?.name}
            </span>
            <span
              className="mono"
              style={{
                fontSize: 11,
                color:
                  user?.role === 'admin'
                    ? 'var(--accent-cyan)'
                    : user?.role === 'manager'
                      ? 'var(--status-hold)'
                      : 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {user?.role}
            </span>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
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

      {showLogoutConfirm && (
        <Modal title="Sign out?" onClose={() => setShowLogoutConfirm(false)} width={360}>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginTop: 0,
              marginBottom: 20,
            }}
          >
            You'll need to log back in with your email and password to continue.
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            <button
              onClick={() => setShowLogoutConfirm(false)}
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 8,
                padding: '9px 16px',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={logout}
              style={{
                background: 'var(--status-cancelled)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '9px 16px',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        .sidebar {
          width: 232px;
          flex-shrink: 0;
          background: var(--bg-panel);
          border-right: 1px solid var(--border-hairline-soft);
          box-shadow: 3px 0 18px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          padding: 20px 14px;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow: hidden;
        }
        .sidebar-nav {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 2px;
          scrollbar-width: thin;
          scrollbar-color: var(--border-hairline) transparent;
        }
        .sidebar-nav::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: var(--border-hairline);
          border-radius: 10px;
        }
        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
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
            transition: transform 0.25s ease, box-shadow 0.25s ease;
            z-index: 210;
            box-shadow: none;
          }
          .sidebar-open {
            transform: translateX(0);
            box-shadow: 6px 0 28px rgba(0, 0, 0, 0.28);
          }
          .sidebar-close-btn {
            display: inline-flex;
          }
          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: var(--overlay-scrim);
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

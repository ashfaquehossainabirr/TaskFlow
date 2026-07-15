import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// allowedRoles: optional array like ['admin', 'manager'] - if omitted, any
// logged-in user can access the route. adminOnly is kept as a shorthand for
// allowedRoles={['admin']} so existing routes don't need to change.
export default function ProtectedRoute({ children, adminOnly = false, allowedRoles = null }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading TaskFlow…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

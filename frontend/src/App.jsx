import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Tasks from './pages/Tasks';
import DeadlineWatch from './pages/DeadlineWatch';
import Users from './pages/Users';
import EmployeeStats from './pages/EmployeeStats';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Overview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/deadlines"
        element={
          <ProtectedRoute>
            <DeadlineWatch />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute adminOnly>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-stats"
        element={
          <ProtectedRoute adminOnly>
            <EmployeeStats />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
    </Routes>
  );
}

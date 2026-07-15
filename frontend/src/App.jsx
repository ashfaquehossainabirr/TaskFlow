import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Tasks from './pages/Tasks';
import DeadlineWatch from './pages/DeadlineWatch';
import Users from './pages/Users';
import EmployeeStats from './pages/EmployeeStats';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import KanbanBoard from './pages/KanbanBoard';
import CalendarView from './pages/CalendarView';
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
        path="/projects"
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kanban"
        element={
          <ProtectedRoute>
            <KanbanBoard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarView />
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
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <EmployeeStats />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
    </Routes>
  );
}

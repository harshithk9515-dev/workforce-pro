import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employees';
import Projects from '../pages/Projects';
import ProjectDetail from '../pages/ProjectDetail';
import Tasks from '../pages/Tasks';
import Reports from '../pages/Reports';
import Notifications from '../pages/Notifications';
import Profile from '../pages/Profile';

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
    <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

    <Route
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/dashboard" element={<Dashboard />} />
      <Route
        path="/employees"
        element={
          <ProtectedRoute roles={['admin', 'manager']}>
            <Employees />
          </ProtectedRoute>
        }
      />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={['admin', 'manager']}>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
    </Route>

    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default AppRoutes;

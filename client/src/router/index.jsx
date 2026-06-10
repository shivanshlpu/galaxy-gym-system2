import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Layout from '../components/common/Layout';

import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Members from '../pages/Members';
import ExpiredMembers from '../pages/ExpiredMembers';
import MemberDetail from '../pages/MemberDetail';
import Attendance from '../pages/Attendance';
import Payments from '../pages/Payments';
import Alerts from '../pages/Alerts';
import SmartAssistant from '../pages/SmartAssistant';
import Reports from '../pages/Reports';
import Settings from '../pages/Settings';
import Launchpad from '../pages/Launchpad';
import Marketing from '../pages/Marketing';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Launchpad />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="expired-members" element={<ExpiredMembers />} />
          <Route path="members/:id" element={<MemberDetail />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="payments" element={<Payments />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="assistant" element={<SmartAssistant />} />
          <Route path="reports" element={<Reports />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;

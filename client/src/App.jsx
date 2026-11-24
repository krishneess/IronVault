import { Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import MemberDashboard from './pages/member/MemberDashboard';
import AccountSettings from './pages/account/AccountSettings';
import { NotFound, Unauthorized } from './pages/StatusPages';
import { GuestRoute, ProtectedRoute } from './routes/guards';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Member area */}
      <Route path="/member" element={<ProtectedRoute roles={['member']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<MemberDashboard />} />
        <Route path="settings" element={<AccountSettings />} />
      </Route>

      {/* Trainer area */}
      <Route path="/trainer" element={<ProtectedRoute roles={['trainer']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<TrainerDashboard />} />
        <Route path="settings" element={<AccountSettings />} />
      </Route>

      {/* Admin area */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="settings" element={<AccountSettings />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

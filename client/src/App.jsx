import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DashboardLayout from './components/layout/DashboardLayout';
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const TrainerDashboard = lazy(() => import('./pages/trainer/TrainerDashboard'));
const TrainerProfile = lazy(() => import('./pages/trainer/TrainerProfile'));
const TrainerMembers = lazy(() => import('./pages/trainer/TrainerMembers'));
const TrainerMemberDetail = lazy(() => import('./pages/trainer/TrainerMemberDetail'));
const PlansList = lazy(() => import('./pages/trainer/PlansList'));
const PlanDetail = lazy(() => import('./pages/trainer/PlanDetail'));
const PlanEditor = lazy(() => import('./pages/trainer/PlanEditor'));
const MemberDashboard = lazy(() => import('./pages/member/MemberDashboard'));
const MemberProfile = lazy(() => import('./pages/member/MemberProfile'));
const MemberPlans = lazy(() => import('./pages/member/MemberPlans'));
const MemberProgress = lazy(() => import('./pages/member/MemberProgress'));
const MemberTrainer = lazy(() => import('./pages/member/MemberTrainer'));
const MemberMembership = lazy(() => import('./pages/member/MemberMembership'));
const AdminMembers = lazy(() => import('./pages/admin/AdminMembers'));
const AdminMemberDetail = lazy(() => import('./pages/admin/AdminMemberDetail'));
const AdminTrainers = lazy(() => import('./pages/admin/AdminTrainers'));
const AdminTrainerDetail = lazy(() => import('./pages/admin/AdminTrainerDetail'));
const AdminAllocation = lazy(() => import('./pages/admin/AdminAllocation'));
const AdminTiers = lazy(() => import('./pages/admin/AdminTiers'));
const AdminMemberships = lazy(() => import('./pages/admin/AdminMemberships'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminAuditLog = lazy(() => import('./pages/admin/AdminAuditLog'));
const AccountSettings = lazy(() => import('./pages/account/AccountSettings'));
import { NotFound, Unauthorized } from './pages/StatusPages';

// Public pages and the shell load eagerly; each role's pages are split into on-demand chunks.
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
        <Route path="workouts" element={<MemberPlans type="workout" />} />
        <Route path="diet" element={<MemberPlans type="diet" />} />
        <Route path="progress" element={<MemberProgress />} />
        <Route path="trainer" element={<MemberTrainer />} />
        <Route path="membership" element={<MemberMembership />} />
        <Route path="profile" element={<MemberProfile />} />
        <Route path="settings" element={<AccountSettings />} />
      </Route>

      {/* Trainer area */}
      <Route path="/trainer" element={<ProtectedRoute roles={['trainer']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<TrainerDashboard />} />
        <Route path="members" element={<TrainerMembers />} />
        <Route path="members/:memberId" element={<TrainerMemberDetail />} />
        <Route path="workout-plans" element={<PlansList key="workout" type="workout" />} />
        <Route path="workout-plans/new" element={<PlanEditor key="workout-new" type="workout" />} />
        <Route path="workout-plans/:id" element={<PlanDetail key="workout" type="workout" />} />
        <Route path="workout-plans/:id/edit" element={<PlanEditor key="workout-edit" type="workout" />} />
        <Route path="diet-plans" element={<PlansList key="diet" type="diet" />} />
        <Route path="diet-plans/new" element={<PlanEditor key="diet-new" type="diet" />} />
        <Route path="diet-plans/:id" element={<PlanDetail key="diet" type="diet" />} />
        <Route path="diet-plans/:id/edit" element={<PlanEditor key="diet-edit" type="diet" />} />
        <Route path="profile" element={<TrainerProfile />} />
        <Route path="settings" element={<AccountSettings />} />
      </Route>

      {/* Admin area */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="members" element={<AdminMembers />} />
        <Route path="members/:id" element={<AdminMemberDetail />} />
        <Route path="trainers" element={<AdminTrainers />} />
        <Route path="trainers/:id" element={<AdminTrainerDetail />} />
        <Route path="allocation" element={<AdminAllocation />} />
        <Route path="memberships" element={<AdminMemberships />} />
        <Route path="tiers" element={<AdminTiers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="activity" element={<AdminAuditLog />} />
        <Route path="settings" element={<AccountSettings />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

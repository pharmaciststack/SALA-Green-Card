import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/layout/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import NewRequestPage from './pages/NewRequestPage'
import FormChangeHours from './pages/forms/FormChangeHours'
import FormChangeDayOff from './pages/forms/FormChangeDayOff'
import FormPersonalSick from './pages/forms/FormPersonalSick'
import FormVacation from './pages/forms/FormVacation'
import FormLate from './pages/forms/FormLate'
import RequestDetailPage from './pages/RequestDetailPage'
import MyHistoryPage from './pages/MyHistoryPage'
import PharmacistInboxPage from './pages/approvals/PharmacistInboxPage'
import ManagerInboxPage from './pages/approvals/ManagerInboxPage'
import DirectorInboxPage from './pages/approvals/DirectorInboxPage'
import ApprovalHistoryPage from './pages/approvals/ApprovalHistoryPage'
import AllApprovalsPage from './pages/approvals/AllApprovalsPage'
import UserManagePage from './pages/admin/UserManagePage'
import QuotaManagePage from './pages/admin/QuotaManagePage'
import AdminNotificationPage from './pages/admin/AdminNotificationPage'
import AuditLogPage from './pages/admin/AuditLogPage'
import SystemSettingsPage from './pages/admin/SystemSettingsPage'
import SuperAdminPage from './pages/admin/SuperAdminPage'

function RootRedirect() {
  const { isAuthenticated, isProfileComplete, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">กำลังโหลด...</p>
      </div>
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isProfileComplete) return <Navigate to="/register" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Authenticated layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/requests/new" element={<NewRequestPage />} />
            <Route path="/requests/new/change-hours" element={<FormChangeHours />} />
            <Route path="/requests/new/change-day-off" element={<FormChangeDayOff />} />
            <Route path="/requests/new/personal-sick" element={<FormPersonalSick />} />
            <Route path="/requests/new/vacation" element={<FormVacation />} />
            <Route path="/requests/new/late" element={<FormLate />} />
            <Route path="/requests/:id" element={<RequestDetailPage />} />
            <Route path="/my-history" element={<MyHistoryPage />} />

            {/* Pharmacist & Area Manager are equivalent — either role can access both inboxes */}
            <Route element={<ProtectedRoute allowedRoles={['pharmacist', 'area_manager', 'admin']} />}>
              <Route path="/pharmacist/inbox" element={<PharmacistInboxPage />} />
              <Route path="/pharmacist/history" element={<ApprovalHistoryPage role="pharmacist" />} />
              <Route path="/manager/inbox" element={<ManagerInboxPage />} />
              <Route path="/manager/history" element={<ApprovalHistoryPage role="area_manager" />} />
            </Route>

            {/* Director */}
            <Route element={<ProtectedRoute allowedRoles={['director', 'admin']} />}>
              <Route path="/director/inbox" element={<DirectorInboxPage />} />
              <Route path="/director/history" element={<ApprovalHistoryPage role="director" />} />
            </Route>

            {/* Unified approvals overview — visible to all approver roles */}
            <Route element={<ProtectedRoute allowedRoles={['pharmacist', 'area_manager', 'director', 'admin']} />}>
              <Route path="/approvals" element={<AllApprovalsPage />} />
            </Route>

            {/* Audit logs — visible to admin and director */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'director']} />}>
              <Route path="/audit-logs" element={<AuditLogPage />} />
            </Route>

            {/* Super admin only */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
              <Route path="/super-admin" element={<SuperAdminPage />} />
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/users" element={<UserManagePage />} />
              <Route path="/admin/quotas" element={<QuotaManagePage />} />
              <Route path="/admin/notify" element={<AdminNotificationPage />} />
              <Route path="/admin/settings" element={<SystemSettingsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

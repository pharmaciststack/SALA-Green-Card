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
import UserManagePage from './pages/admin/UserManagePage'
import QuotaManagePage from './pages/admin/QuotaManagePage'

function RootRedirect() {
  const { isAuthenticated, isProfileComplete, loading } = useAuth()
  if (loading) return null
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

            {/* Pharmacist */}
            <Route element={<ProtectedRoute allowedRoles={['pharmacist', 'admin']} />}>
              <Route path="/pharmacist/inbox" element={<PharmacistInboxPage />} />
              <Route path="/pharmacist/history" element={<ApprovalHistoryPage role="pharmacist" />} />
            </Route>

            {/* Area Manager */}
            <Route element={<ProtectedRoute allowedRoles={['area_manager', 'admin']} />}>
              <Route path="/manager/inbox" element={<ManagerInboxPage />} />
              <Route path="/manager/history" element={<ApprovalHistoryPage role="area_manager" />} />
            </Route>

            {/* Director */}
            <Route element={<ProtectedRoute allowedRoles={['director', 'admin']} />}>
              <Route path="/director/inbox" element={<DirectorInboxPage />} />
              <Route path="/director/history" element={<ApprovalHistoryPage role="director" />} />
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/users" element={<UserManagePage />} />
              <Route path="/admin/quotas" element={<QuotaManagePage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

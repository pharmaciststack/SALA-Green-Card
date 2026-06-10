import { Navigate, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { UserRole } from '../../types'

interface Props {
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { isAuthenticated, isProfileComplete, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isProfileComplete) return <Navigate to="/register" replace />

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🚫</p>
          <h2 className="text-lg font-bold text-gray-700">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
          <Link to="/dashboard" className="text-green-600 text-sm mt-2 block hover:underline">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    )
  }

  return <Outlet />
}

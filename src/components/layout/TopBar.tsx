import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { signOut } from '../../services/authService'
import { ROLE_LABELS } from '../../utils/constants'

interface Props {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: Props) {
  const { profile } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  async function handleSignOut() {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
      >
        ☰
      </button>

      <div className="hidden md:block">
        <h2 className="text-sm font-medium text-gray-600">
          {profile?.branchName && (
            <span className="text-green-600 font-semibold">{profile.branchName}</span>
          )}
        </h2>
      </div>

      <div className="relative ml-auto">
        <button
          onClick={() => setShowDropdown((v) => !v)}
          className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-3 py-1.5 transition-colors"
        >
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-sm">
              {profile?.displayName?.[0] ?? '?'}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-800 leading-tight">
              {profile?.displayName ?? 'กำลังโหลด...'}
            </p>
            <p className="text-xs text-gray-400 leading-tight">
              {profile?.role ? ROLE_LABELS[profile.role] : ''}
            </p>
          </div>
          <span className="text-gray-400 text-xs">▾</span>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-500">{profile?.email}</p>
              <p className="text-xs font-medium text-gray-700">{profile?.employeeCode}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

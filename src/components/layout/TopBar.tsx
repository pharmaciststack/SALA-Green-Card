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
    <header
      className="flex items-center justify-between px-4 py-2.5 sticky top-0 z-30"
      style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
    >
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg text-white/90 hover:bg-white/10"
      >
        ☰
      </button>

      <div className="flex items-center gap-2.5 text-white">
        <img
          src="https://img1.pic.in.th/images/logo--1.png"
          alt="ศาลาโอสถ"
          className="w-9 h-9 bg-white rounded-lg p-1 object-contain hidden sm:block"
        />
        <div>
          <h1 className="text-base font-bold leading-tight">ระบบลาและบันทึกเวลาทำงาน</h1>
          <p className="text-xs opacity-80 leading-tight">
            บริษัท ศาลาโอสถรีเทล จำกัด
            {profile?.branchName ? ` · ${profile.branchName}` : ''}
          </p>
        </div>
      </div>

      <div className="relative ml-auto">
        <button
          onClick={() => setShowDropdown((v) => !v)}
          className="flex items-center gap-2 hover:bg-white/10 rounded-lg px-2.5 py-1.5 transition-colors"
        >
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="" className="w-8 h-8 rounded-full border-2 border-white/40" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {profile?.displayName?.[0] ?? '?'}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-white leading-tight">
              {profile?.displayName ?? 'กำลังโหลด...'}
            </p>
            <p className="text-xs text-white/70 leading-tight">
              {profile?.role ? ROLE_LABELS[profile.role] : ''}
            </p>
          </div>
          <span className="text-white/70 text-xs">▾</span>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
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

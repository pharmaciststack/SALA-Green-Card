import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface NavItem {
  to: string
  label: string
  icon: string
  roles?: string[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'หน้าหลัก', icon: '🏠' },
  { to: '/requests/new', label: 'ยื่นคำขอ', icon: '✏️', roles: ['employee', 'pharmacist', 'area_manager', 'director', 'admin'] },
  { to: '/my-history', label: 'ประวัติของฉัน', icon: '📋' },
  { to: '/pharmacist/inbox', label: 'รออนุมัติ (เภสัช)', icon: '📥', roles: ['pharmacist'] },
  { to: '/pharmacist/history', label: 'ประวัติการอนุมัติ', icon: '📖', roles: ['pharmacist'] },
  { to: '/manager/inbox', label: 'รออนุมัติ (Manager)', icon: '📥', roles: ['area_manager'] },
  { to: '/manager/history', label: 'ประวัติการอนุมัติ', icon: '📖', roles: ['area_manager'] },
  { to: '/director/inbox', label: 'รออนุมัติ (ผอ.)', icon: '📥', roles: ['director'] },
  { to: '/director/history', label: 'ประวัติการอนุมัติ', icon: '📖', roles: ['director'] },
  { to: '/admin/users', label: 'จัดการผู้ใช้', icon: '👥', roles: ['admin'] },
  { to: '/admin/quotas', label: 'จัดการโควต้า', icon: '⚙️', roles: ['admin'] },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: Props) {
  const { role } = useAuth()

  const visible = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  )

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 z-50 transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:z-auto`}
      >
        <div className="flex items-center gap-3 px-5 h-14 border-b border-gray-100">
          <span className="text-2xl">📋</span>
          <span className="font-bold text-gray-800 text-sm leading-tight">
            ระบบลา<br />
            <span className="text-green-600 font-semibold">และบันทึกเวลา</span>
          </span>
        </div>

        <nav className="p-3 space-y-0.5">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}

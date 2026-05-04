import { useEffect, useState } from 'react'
import { UserProfile, UserRole } from '../../types'
import { getAllUsers, updateUserRole } from '../../services/userService'
import { ROLE_LABELS } from '../../utils/constants'

export default function UserManagePage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    getAllUsers().then((u) => { setUsers(u); setLoading(false) })
  }, [])

  async function handleRoleChange(uid: string, role: UserRole, areaId: string) {
    setSaving(uid)
    await updateUserRole(uid, role, areaId)
    setSaving(null)
  }

  if (loading) return <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">จัดการผู้ใช้</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-3">ชื่อ</th>
              <th className="px-4 py-3">สาขา</th>
              <th className="px-4 py-3">บทบาท</th>
              <th className="px-4 py-3">Area ID</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <UserRow key={u.uid} user={u} saving={saving === u.uid} onSave={handleRoleChange} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UserRow({ user, saving, onSave }: { user: UserProfile; saving: boolean; onSave: (uid: string, role: UserRole, areaId: string) => void }) {
  const [role, setRole] = useState<UserRole>(user.role)
  const [areaId, setAreaId] = useState(user.areaId || '')

  const roles: UserRole[] = ['employee', 'pharmacist', 'area_manager', 'director', 'admin']

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <p className="font-medium text-gray-800">{user.displayName}</p>
        <p className="text-xs text-gray-400">{user.email}</p>
      </td>
      <td className="px-4 py-3 text-gray-600">{user.branchName}</td>
      <td className="px-4 py-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
        >
          {roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </td>
      <td className="px-4 py-3">
        <input
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-green-400"
          placeholder="area-01"
        />
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onSave(user.uid, role, areaId)}
          disabled={saving}
          className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? '...' : 'บันทึก'}
        </button>
      </td>
    </tr>
  )
}

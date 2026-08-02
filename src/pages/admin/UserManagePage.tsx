import { useEffect, useState } from 'react'
import { UserProfile, UserRole, EmployeeGroup } from '../../types'
import { getAllUsers, updateUserRole, updateUserGroup } from '../../services/userService'
import { listGroups } from '../../services/groupService'
import { BRANCHES, POSITIONS } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'

// Full ladder. super_admin is intentionally NOT assignable from the UI —
// it is bootstrapped via Firebase Console only, and can never be demoted here.
const ROLE_HIERARCHY: UserRole[] = ['employee', 'pharmacist', 'area_manager', 'director', 'admin', 'super_admin']

// Roles a regular admin may assign to others (up to director).
const ADMIN_ASSIGNABLE: UserRole[] = ['employee', 'pharmacist', 'area_manager', 'director']
// Roles a super admin may assign (adds admin; still not super_admin).
const SUPER_ASSIGNABLE: UserRole[] = [...ADMIN_ASSIGNABLE, 'admin']

const ROLE_META: Record<UserRole, { label: string; color: string; bg: string }> = {
  employee:     { label: 'พนักงาน',        color: 'text-gray-600',   bg: 'bg-gray-100' },
  pharmacist:   { label: 'เภสัชกร',        color: 'text-blue-700',   bg: 'bg-blue-50' },
  area_manager: { label: 'ผจก.เขต',        color: 'text-purple-700', bg: 'bg-purple-50' },
  director:     { label: 'ผู้อำนวยการ',    color: 'text-orange-700', bg: 'bg-orange-50' },
  admin:        { label: 'ผู้ดูแลระบบ',    color: 'text-green-700',  bg: 'bg-green-50' },
  super_admin:  { label: 'ผู้ดูแลสูงสุด',   color: 'text-red-700',    bg: 'bg-red-50' },
}

export default function UserManagePage() {
  const { profile: actor } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [groups, setGroups] = useState<EmployeeGroup[]>([])
  const [filtered, setFiltered] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [filterPosition, setFilterPosition] = useState('')
  const [filterRole, setFilterRole] = useState('')

  useEffect(() => {
    Promise.all([getAllUsers(), listGroups()])
      .then(([u, g]) => { setUsers(u); setGroups(g) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = users
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) => u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      )
    }
    if (filterBranch)   result = result.filter((u) => u.branchName === filterBranch)
    if (filterPosition) result = result.filter((u) => u.position === filterPosition)
    if (filterRole)     result = result.filter((u) => u.role === filterRole)
    setFiltered(result)
  }, [users, search, filterBranch, filterPosition, filterRole])

  async function handleRoleChange(uid: string, role: UserRole) {
    const target = users.find(u => u.uid === uid)
    if (!target || !actor) return
    if (uid === actor.uid) {
      window.alert('ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้ กรุณาให้ผู้ดูแลระบบคนอื่นเปลี่ยนให้')
      return
    }
    // super_admin accounts can never be modified from the UI.
    if (target.role === 'super_admin') {
      window.alert('ไม่สามารถแก้สิทธิ์ของผู้ดูแลระบบสูงสุดได้')
      return
    }
    // Only a super admin may touch admin accounts or grant the admin role.
    if ((target.role === 'admin' || role === 'admin') && actor.role !== 'super_admin') {
      window.alert('เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่กำหนดสิทธิ์ระดับผู้ดูแลระบบได้')
      return
    }
    setSaving(uid)
    await updateUserRole(
      uid,
      role,
      target.areaId ?? '',
      actor,
      { name: target.displayName || target.email, previousRole: target.role }
    )
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u))
    setSaving(null)
  }

  async function handleGroupChange(uid: string, groupId: string) {
    const target = users.find(u => u.uid === uid)
    if (!target || !actor) return
    setSaving(uid)
    await updateUserGroup(
      uid,
      groupId,
      actor,
      { name: target.displayName || target.email, groupName: groups.find(g => g.id === groupId)?.name ?? 'ค่าเริ่มต้น' }
    )
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, groupId } : u))
    setSaving(null)
  }

  if (loading) return <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">จัดการผู้ใช้</h1>
        <span className="text-sm text-gray-400">{filtered.length} / {users.length} คน</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="🔍 ค้นหาชื่อ หรืออีเมล..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 flex-1 min-w-48"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
        >
          <option value="">ทุกสิทธิ์</option>
          {ROLE_HIERARCHY.map((r) => (
            <option key={r} value={r}>{ROLE_META[r].label}</option>
          ))}
        </select>
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
        >
          <option value="">ทุกสาขา</option>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          value={filterPosition}
          onChange={(e) => setFilterPosition(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
        >
          <option value="">ทุกตำแหน่ง</option>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {ROLE_HIERARCHY.map((r) => (
          <span key={r} className={`px-2.5 py-1 rounded-full font-medium ${ROLE_META[r].bg} ${ROLE_META[r].color}`}>
            {ROLE_META[r].label}
          </span>
        ))}
        <span className="text-gray-400 self-center ml-1">← ระดับสิทธิ์น้อย → มาก</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">ผู้ใช้</th>
              <th className="px-4 py-3">อีเมล</th>
              <th className="px-4 py-3">สาขา / ตำแหน่ง</th>
              <th className="px-4 py-3">สิทธิ์ปัจจุบัน</th>
              <th className="px-4 py-3 text-center">เปลี่ยนสิทธิ์</th>
              <th className="px-4 py-3 text-center">กลุ่มพนักงาน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">ไม่พบผู้ใช้</td>
              </tr>
            )}
            {filtered.map((u) => (
              <UserRow
                key={u.uid}
                user={u}
                groups={groups}
                saving={saving === u.uid}
                isSelf={u.uid === actor?.uid}
                actorRole={actor?.role ?? 'employee'}
                onChange={handleRoleChange}
                onGroupChange={handleGroupChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UserRow({ user, groups, saving, isSelf, actorRole, onChange, onGroupChange }: {
  user: UserProfile
  groups: EmployeeGroup[]
  saving: boolean
  isSelf: boolean
  actorRole: UserRole
  onChange: (uid: string, role: UserRole) => void
  onGroupChange: (uid: string, groupId: string) => void
}) {
  const idx = ROLE_HIERARCHY.indexOf(user.role)
  const meta = ROLE_META[user.role] ?? ROLE_META.employee

  const isSuperActor = actorRole === 'super_admin'
  // What this actor may assign, always including the target's current role so
  // the dropdown can display it even when it's above the actor's ceiling.
  const assignable = isSuperActor ? SUPER_ASSIGNABLE : ADMIN_ASSIGNABLE
  const options = assignable.includes(user.role) ? assignable : [user.role, ...assignable]
  // Row is locked (label instead of dropdown) when it can't be edited here.
  const locked =
    isSelf ||
    user.role === 'super_admin' ||
    (user.role === 'admin' && !isSuperActor)
  const lockLabel = isSelf
    ? 'บัญชีของคุณ'
    : user.role === 'super_admin'
      ? '🔒 ผู้ดูแลสูงสุด'
      : 'เฉพาะผู้ดูแลสูงสุด'

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* User info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-800 truncate">{user.displayName || '—'}</p>
            <p className="text-xs text-gray-400">{user.employeeCode || '—'}</p>
          </div>
        </div>
      </td>

      {/* Email */}
      <td className="px-4 py-3">
        <p className="text-xs text-gray-700 truncate max-w-[220px]" title={user.email}>
          {user.email || '—'}
        </p>
      </td>

      {/* Branch / position */}
      <td className="px-4 py-3">
        <p className="text-xs text-gray-700">{user.branchName || '—'}</p>
        <p className="text-xs text-gray-400">{user.position || '—'}</p>
      </td>

      {/* Current role badge */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}>
          {meta.label}
        </span>
        <p className="text-[10px] text-gray-400 mt-0.5">ระดับ {idx + 1} / {ROLE_HIERARCHY.length}</p>
      </td>

      {/* Role dropdown */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          {locked ? (
            <span className="text-[11px] text-gray-400 italic min-w-[140px] text-center">{lockLabel}</span>
          ) : (
            <select
              value={user.role}
              onChange={(e) => onChange(user.uid, e.target.value as UserRole)}
              disabled={saving}
              className="border-[1.5px] border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white cursor-pointer
                focus:outline-none focus:border-green-600 focus:ring-[3px] focus:ring-green-600/15
                disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
            >
              {options.map((r) => (
                <option key={r} value={r}>{ROLE_META[r].label}</option>
              ))}
            </select>
          )}
          {saving && (
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </td>

      {/* Group dropdown */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-center">
          <select
            value={user.groupId ?? ''}
            onChange={(e) => onGroupChange(user.uid, e.target.value)}
            disabled={saving}
            className="border-[1.5px] border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white cursor-pointer
              focus:outline-none focus:border-green-600 focus:ring-[3px] focus:ring-green-600/15
              disabled:opacity-50 disabled:cursor-not-allowed min-w-[130px]"
          >
            <option value="">⭐ ค่าเริ่มต้น</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </td>
    </tr>
  )
}

import { useEffect, useState } from 'react'
import { UserProfile } from '../../types'
import { getAllUsers } from '../../services/userService'
import { getQuota, updateQuota } from '../../services/quotaService'
import { LeaveQuota } from '../../types'
import { useAuth } from '../../hooks/useAuth'

export default function QuotaManagePage() {
  const { profile: actor } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [selected, setSelected] = useState<UserProfile | null>(null)
  const [quota, setQuota] = useState<LeaveQuota | null>(null)
  const [saving, setSaving] = useState(false)
  const year = new Date().getFullYear()

  useEffect(() => {
    getAllUsers().then(setUsers)
  }, [])

  async function selectUser(u: UserProfile) {
    setSelected(u)
    const q = await getQuota(u.uid, year)
    setQuota(q)
  }

  async function handleSave() {
    if (!selected || !quota || !actor) return
    setSaving(true)
    await updateQuota(selected.uid, year, quota, actor, selected.displayName || selected.email)
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">จัดการโควต้าวันลา</h1>

      {/* User picker */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <label className="label">เลือกพนักงาน</label>
        <select
          className="input"
          onChange={(e) => {
            const u = users.find((u) => u.uid === e.target.value)
            if (u) selectUser(u)
          }}
          defaultValue=""
        >
          <option value="" disabled>-- เลือก --</option>
          {users.map((u) => (
            <option key={u.uid} value={u.uid}>{u.displayName} ({u.branchName})</option>
          ))}
        </select>
      </div>

      {/* Quota editor */}
      {selected && quota && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4">
            {selected.displayName} · ปี {year}
          </h2>
          <div className="space-y-4">
            {[
              { label: 'ลากิจ (วัน)', totalKey: 'personal_total', usedKey: 'personal_used' },
              { label: 'ลาป่วย (วัน)', totalKey: 'sick_total', usedKey: 'sick_used' },
              { label: 'ลาพักร้อน (วัน)', totalKey: 'vacation_total', usedKey: 'vacation_used' },
            ].map(({ label, totalKey, usedKey }) => (
              <div key={totalKey} className="grid grid-cols-3 gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <div>
                  <p className="text-xs text-gray-400 mb-1">สิทธิ์รวม</p>
                  <input
                    type="number"
                    min={0}
                    value={(quota as unknown as Record<string, number>)[totalKey]}
                    onChange={(e) => setQuota({ ...quota, [totalKey]: Number(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">ใช้แล้ว</p>
                  <input
                    type="number"
                    min={0}
                    value={(quota as unknown as Record<string, number>)[usedKey]}
                    onChange={(e) => setQuota({ ...quota, [usedKey]: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full mt-6"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      )}
    </div>
  )
}

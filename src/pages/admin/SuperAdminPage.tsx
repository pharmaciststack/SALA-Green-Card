import { useEffect, useState } from 'react'
import { UserProfile } from '../../types'
import { getAllUsers } from '../../services/userService'
import { updateSettings, getSettings, DEFAULT_SETTINGS } from '../../services/settingsService'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_LABELS } from '../../utils/constants'

export default function SuperAdminPage() {
  const { profile: actor } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    getAllUsers().then(setUsers).finally(() => setLoading(false))
  }, [])

  const admins = users.filter((u) => u.role === 'admin' || u.role === 'super_admin')

  async function resetSettings() {
    if (!actor) return
    if (!window.confirm('รีเซ็ตการตั้งค่าระบบ (ค่าเริ่มต้น) กลับเป็นค่าโรงงานทั้งหมด? การกระทำนี้ไม่กระทบกลุ่มพนักงานที่สร้างไว้')) return
    setBusy(true)
    setMsg('')
    try {
      const current = await getSettings()
      // Keep the existing holiday calendar; reset only the numeric rule values.
      await updateSettings({ ...DEFAULT_SETTINGS, holidays: current.holidays }, actor)
      setMsg('✅ รีเซ็ตค่าเริ่มต้นของระบบแล้ว')
    } catch {
      setMsg('❌ รีเซ็ตไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">🔐 ผู้ดูแลระบบสูงสุด</h1>
        <p className="text-sm text-gray-500 mt-0.5">เมนูสำหรับ Super Admin เท่านั้น</p>
      </div>

      {/* Admin roster */}
      <div className="card">
        <div className="card-title">🛡️ รายชื่อผู้ดูแลระบบ ({admins.length})</div>
        {loading ? (
          <p className="text-sm text-gray-400 py-4 text-center">กำลังโหลด...</p>
        ) : admins.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีผู้ดูแลระบบ</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {admins.map((u) => (
              <div key={u.uid} className="flex items-center gap-3 py-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  u.role === 'super_admin' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {(u.displayName || u.email || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.displayName || u.email}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  u.role === 'super_admin' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>
                  {ROLE_LABELS[u.role]}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-3">
          💡 สิทธิ์ "ผู้ดูแลระบบสูงสุด" ตั้งได้จาก Firebase Console เท่านั้น เพื่อความปลอดภัย —
          ไม่มีใครลด/แก้สิทธิ์นี้ผ่านหน้าเว็บได้
        </p>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border-2 border-red-200 p-5">
        <div className="text-base font-bold text-red-700 mb-1">⚠️ Danger Zone</div>
        <p className="text-sm text-gray-500 mb-4">การกระทำที่มีผลกับทั้งระบบ ใช้ด้วยความระมัดระวัง</p>

        {msg && (
          <div className="mb-3 text-sm">{msg}</div>
        )}

        <div className="flex items-center justify-between gap-3 bg-red-50 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">รีเซ็ตการตั้งค่าเริ่มต้นของระบบ</p>
            <p className="text-xs text-gray-500">คืนค่าโควต้า/เกณฑ์ต่างๆ เป็นค่าโรงงาน (ไม่ลบกลุ่มพนักงาน/วันหยุด)</p>
          </div>
          <button
            onClick={resetSettings}
            disabled={busy}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {busy ? 'กำลังรีเซ็ต...' : 'รีเซ็ต'}
          </button>
        </div>
      </div>
    </div>
  )
}

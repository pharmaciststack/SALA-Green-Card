import { useEffect, useState } from 'react'
import { AuditLog, AuditAction } from '../../types'
import { listAuditLogs } from '../../services/auditLogService'
import { useAuth } from '../../hooks/useAuth'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

const ACTION_META: Record<AuditAction, { label: string; icon: string; color: string }> = {
  role_change:       { label: 'เปลี่ยนสิทธิ์',     icon: '🔑', color: 'bg-blue-50 text-blue-700' },
  quota_update:      { label: 'แก้โควต้าวันลา',     icon: '📊', color: 'bg-purple-50 text-purple-700' },
  send_notification: { label: 'ส่งอีเมล',          icon: '📧', color: 'bg-orange-50 text-orange-700' },
  request_approved:  { label: 'อนุมัติคำขอ',       icon: '✅', color: 'bg-green-50 text-green-700' },
  request_rejected:  { label: 'ปฏิเสธคำขอ',        icon: '❌', color: 'bg-red-50 text-red-700' },
  settings_update:   { label: 'แก้ไขตั้งค่าระบบ',  icon: '⚙️', color: 'bg-gray-100 text-gray-700' },
  group_update:      { label: 'จัดการกลุ่ม',       icon: '👥', color: 'bg-teal-50 text-teal-700' },
  group_assign:      { label: 'ย้ายกลุ่มพนักงาน',  icon: '🔀', color: 'bg-teal-50 text-teal-700' },
}

export default function AuditLogPage() {
  const { role } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterAction, setFilterAction] = useState<AuditAction | ''>('')
  const [filterRole, setFilterRole] = useState<'admin' | 'director' | ''>('')

  useEffect(() => {
    setLoading(true)
    listAuditLogs({ actorRole: filterRole || undefined, limitCount: 300 })
      .then(setLogs)
      .catch((e) => setError(e?.message || 'โหลดประวัติไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [filterRole])

  const filtered = filterAction ? logs.filter((l) => l.action === filterAction) : logs

  function formatDetails(log: AuditLog): string {
    const d = log.details
    switch (log.action) {
      case 'role_change':
        return `${d.previousRole} → ${d.newRole}`
      case 'quota_update':
        return `ปี ${d.year}: ${Object.keys((d.changes as object) ?? {}).join(', ')}`
      case 'send_notification':
        return `"${d.subject}" → ${d.recipientCount} คน`
      case 'request_approved':
      case 'request_rejected':
        return `${d.type}${d.days ? ` · ${d.days} วัน` : ''}${d.note ? ` · "${d.note}"` : ''}`
      case 'settings_update':
        return `combined ${d.combinedCounterMonthLimit}/เดือน · สาย ${d.tardinessBonusThreshold} นาที · วันหยุด ${d.holidayCount} วัน`
      case 'group_update':
        return `${d.action === 'create' ? 'สร้าง' : d.action === 'delete' ? 'ลบ' : 'แก้ไข'}กลุ่ม "${d.name}"`
      case 'group_assign':
        return `→ กลุ่ม "${d.groupName}"`
      default:
        return ''
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">📜 ประวัติการดำเนินการ</h1>
        <span className="text-sm text-gray-400">{filtered.length} รายการ</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as 'admin' | 'director' | '')}
          className="border-[1.5px] border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-600"
        >
          <option value="">ทุกสิทธิ์ (Admin + ผอ.)</option>
          {role === 'admin' && <option value="admin">เฉพาะ Admin</option>}
          <option value="director">เฉพาะ ผอ.</option>
        </select>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value as AuditAction | '')}
          className="border-[1.5px] border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-600"
        >
          <option value="">ทุกประเภทการกระทำ</option>
          {(Object.keys(ACTION_META) as AuditAction[]).map((a) => (
            <option key={a} value={a}>{ACTION_META[a].icon} {ACTION_META[a].label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">เวลา</th>
                <th className="px-4 py-3">ผู้กระทำ</th>
                <th className="px-4 py-3">การกระทำ</th>
                <th className="px-4 py-3">เป้าหมาย</th>
                <th className="px-4 py-3">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">ยังไม่มีประวัติ</td>
                </tr>
              )}
              {filtered.map((log) => {
                const meta = ACTION_META[log.action]
                return (
                  <tr key={log.logId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {format(log.createdAt, 'd MMM yy HH:mm', { locale: th })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 font-medium">{log.actorName}</p>
                      <p className="text-[10px] text-gray-400">{log.actorRole}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {log.targetName || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {formatDetails(log)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

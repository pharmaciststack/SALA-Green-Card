import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LeaveRequest, UserRole } from '../../types'
import { getPharmacistHistory, getManagerHistory, getDirectorHistory } from '../../services/requestService'
import { useAuth } from '../../hooks/useAuth'
import { REQUEST_TYPE_LABELS, REQUEST_TYPE_ICONS, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants'
import { formatThaiDate } from '../../utils/dateUtils'

interface Props { role: UserRole }

export default function ApprovalHistoryPage({ role }: Props) {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const fn =
      role === 'pharmacist' ? getPharmacistHistory
      : role === 'area_manager' ? getManagerHistory
      : getDirectorHistory
    fn(profile.uid).then((r) => { setRequests(r); setLoading(false) })
  }, [profile, role])

  if (loading) return <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">ประวัติการอนุมัติ</h1>
      {requests.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📖</p>
          <p>ยังไม่มีประวัติ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Link
              key={r.requestId}
              to={`/requests/${r.requestId}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{REQUEST_TYPE_ICONS[r.type]}</span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{REQUEST_TYPE_LABELS[r.type]}</p>
                    <p className="text-xs text-gray-500">{r.submitterName}</p>
                    <p className="text-xs text-gray-400">{r.createdAt ? formatThaiDate(r.createdAt) : ''}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>
                  {STATUS_LABELS[r.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

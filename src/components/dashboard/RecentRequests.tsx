import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LeaveRequest } from '../../types'
import { listenMyRequests } from '../../services/requestService'
import { useAuth } from '../../hooks/useAuth'
import { STATUS_LABELS, STATUS_COLORS, REQUEST_TYPE_LABELS } from '../../utils/constants'
import { formatThaiDate } from '../../utils/dateUtils'

export default function RecentRequests() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<LeaveRequest[]>([])

  useEffect(() => {
    if (!profile) return
    const unsub = listenMyRequests(profile.uid, (reqs) => setRequests(reqs.slice(0, 5)))
    return unsub
  }, [profile])

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">คำขอล่าสุด</h3>
        <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีคำขอ</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">คำขอล่าสุด</h3>
        <Link to="/my-history" className="text-xs text-green-600 hover:underline">ดูทั้งหมด</Link>
      </div>
      <div className="space-y-2">
        {requests.map((r) => (
          <Link
            key={r.requestId}
            to={`/requests/${r.requestId}`}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">{REQUEST_TYPE_LABELS[r.type]}</p>
              <p className="text-xs text-gray-400">{r.createdAt ? formatThaiDate(r.createdAt) : ''}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>
              {STATUS_LABELS[r.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

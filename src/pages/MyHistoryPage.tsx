import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LeaveRequest, RequestStatus } from '../types'
import { listenMyRequests } from '../services/requestService'
import { useAuth } from '../hooks/useAuth'
import { REQUEST_TYPE_LABELS, REQUEST_TYPE_ICONS, STATUS_LABELS, STATUS_COLORS } from '../utils/constants'
import { formatThaiDate } from '../utils/dateUtils'

const ALL = 'all'

export default function MyHistoryPage() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [filter, setFilter] = useState<RequestStatus | 'all'>(ALL)

  useEffect(() => {
    if (!profile) return
    return listenMyRequests(profile.uid, setRequests)
  }, [profile])

  const filtered = filter === ALL ? requests : requests.filter((r) => r.status === filter)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">ประวัติคำขอของฉัน</h1>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {([ALL, 'pending_pharmacist', 'pending_manager', 'pending_director', 'approved', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filter === s ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {s === ALL ? 'ทั้งหมด' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>ไม่มีคำขอ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
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
                    <p className="text-xs text-gray-400">{r.createdAt ? formatThaiDate(r.createdAt) : ''}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>
                  {STATUS_LABELS[r.status]}
                </span>
              </div>
              {r.details.days && (
                <p className="text-xs text-gray-500 mt-2 ml-9">{r.details.days} วัน</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LeaveRequest } from '../types'
import { getRequest, approveByPharmacist, rejectByPharmacist, approveByManager, rejectByManager, approveByDirector, rejectByDirector } from '../services/requestService'
import { useAuth } from '../hooks/useAuth'
import { REQUEST_TYPE_LABELS, REQUEST_TYPE_ICONS, STATUS_LABELS, STATUS_COLORS } from '../utils/constants'
import { formatThaiDate } from '../utils/dateUtils'
import StatusTimeline from '../components/approval/StatusTimeline'
import ApprovalModal from '../components/approval/ApprovalModal'

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [request, setRequest] = useState<LeaveRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!id) return
    getRequest(id).then((r) => { setRequest(r); setLoading(false) })
  }, [id])

  if (loading) return <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
  if (!request) return <div className="text-center py-12 text-gray-400">ไม่พบคำขอ</div>

  const canApproveAsPharmacist = profile?.role === 'pharmacist' && request.status === 'pending_pharmacist'
  const canApproveAsManager = profile?.role === 'area_manager' && request.status === 'pending_manager'
  const canApproveAsDirector = profile?.role === 'director' && request.status === 'pending_director'
  const canApprove = canApproveAsPharmacist || canApproveAsManager || canApproveAsDirector

  async function handleApprove(note: string) {
    if (!profile || !id) return
    if (canApproveAsPharmacist) await approveByPharmacist(id, profile, note)
    else if (canApproveAsManager) await approveByManager(id, profile, note)
    else if (canApproveAsDirector) await approveByDirector(id, profile, note)
    const updated = await getRequest(id)
    setRequest(updated)
  }

  async function handleReject(note: string) {
    if (!profile || !id) return
    if (canApproveAsPharmacist) await rejectByPharmacist(id, profile, note)
    else if (canApproveAsManager) await rejectByManager(id, profile, note)
    else if (canApproveAsDirector) await rejectByDirector(id, profile, note)
    const updated = await getRequest(id)
    setRequest(updated)
  }

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        ← ย้อนกลับ
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{REQUEST_TYPE_ICONS[request.type]}</span>
            <div>
              <h1 className="text-lg font-bold text-gray-800">{REQUEST_TYPE_LABELS[request.type]}</h1>
              <p className="text-sm text-gray-500">{request.submitterName} · {request.createdAt ? formatThaiDate(request.createdAt) : ''}</p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${STATUS_COLORS[request.status]}`}>
            {STATUS_LABELS[request.status]}
          </span>
        </div>

        {/* Details */}
        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
          {request.details.date && <div><span className="text-gray-500">วันที่: </span>{request.details.date}</div>}
          {request.details.startDate && <div><span className="text-gray-500">วันเริ่ม: </span>{formatThaiDate(request.details.startDate)}</div>}
          {request.details.endDate && <div><span className="text-gray-500">วันสิ้นสุด: </span>{formatThaiDate(request.details.endDate)}</div>}
          {request.details.days && <div><span className="text-gray-500">จำนวน: </span>{request.details.days} วัน</div>}
          {request.details.leaveType && <div><span className="text-gray-500">ประเภท: </span>{request.details.leaveType === 'personal' ? 'ลากิจ' : 'ลาป่วย'}</div>}
          {request.details.originalStart && <div><span className="text-gray-500">เวลาเดิม: </span>{request.details.originalStart} – {request.details.originalEnd}</div>}
          {request.details.newStart && <div><span className="text-gray-500">เวลาใหม่: </span>{request.details.newStart} – {request.details.newEnd}</div>}
          {request.details.originalDayOff && <div><span className="text-gray-500">วันหยุดเดิม: </span>{formatThaiDate(request.details.originalDayOff!)}</div>}
          {request.details.newDayOff && <div><span className="text-gray-500">วันหยุดใหม่: </span>{formatThaiDate(request.details.newDayOff!)}</div>}
          {request.details.scheduledStart && <div><span className="text-gray-500">เวลาที่กำหนด: </span>{request.details.scheduledStart}</div>}
          {request.details.actualArrival && <div><span className="text-gray-500">เวลาที่มาถึง: </span>{request.details.actualArrival}</div>}
          <div><span className="text-gray-500">เหตุผล: </span>{request.details.reason}</div>
          {request.details.attachmentUrl && (
            <a href={request.details.attachmentUrl} target="_blank" rel="noreferrer" className="text-green-600 hover:underline">
              📎 ดูใบรับรองแพทย์
            </a>
          )}
        </div>

        {/* Timeline */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">สถานะการอนุมัติ</h3>
          <StatusTimeline request={request} />
        </div>

        {/* Approve button */}
        {canApprove && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            พิจารณาคำขอ
          </button>
        )}
      </div>

      {showModal && (
        <ApprovalModal
          request={request}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

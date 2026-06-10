import { useEffect, useState } from 'react'
import { LeaveRequest } from '../../types'
import { listenPharmacistInbox, approveByPharmacist, rejectByPharmacist } from '../../services/requestService'
import { useAuth } from '../../hooks/useAuth'
import RequestCard from '../../components/approval/RequestCard'
import ApprovalModal from '../../components/approval/ApprovalModal'

export default function PharmacistInboxPage() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [selected, setSelected] = useState<LeaveRequest | null>(null)

  useEffect(() => {
    if (!profile) return
    return listenPharmacistInbox(profile.areaId || profile.branchName, setRequests)
  }, [profile])

  async function handleApprove(note: string) {
    if (!selected || !profile) return
    await approveByPharmacist(selected.requestId, profile, note)
    setSelected(null)
  }
  async function handleReject(note: string) {
    if (!selected || !profile) return
    await rejectByPharmacist(selected.requestId, profile, note)
    setSelected(null)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-2">รออนุมัติ — ขั้นที่ 1</h1>
      <p className="text-sm text-gray-500 mb-4">{requests.length} รายการที่รอการพิจารณา</p>
      {requests.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p>ไม่มีคำขอที่รอการพิจารณา</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <RequestCard key={r.requestId} request={r} onReview={() => setSelected(r)} />
          ))}
        </div>
      )}
      {selected && (
        <ApprovalModal
          request={selected}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

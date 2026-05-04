import { useState } from 'react'
import { LeaveRequest } from '../../types'
import { REQUEST_TYPE_LABELS } from '../../utils/constants'

interface Props {
  request: LeaveRequest
  onApprove: (note: string) => Promise<void>
  onReject: (note: string) => Promise<void>
  onClose: () => void
}

export default function ApprovalModal({ request, onApprove, onReject, onClose }: Props) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handle(action: 'approve' | 'reject') {
    setLoading(true)
    try {
      if (action === 'approve') await onApprove(note)
      else await onReject(note)
      onClose()
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">พิจารณาคำขอ</h2>
        <p className="text-sm text-gray-500 mb-4">
          {REQUEST_TYPE_LABELS[request.type]} · {request.submitterName}
        </p>

        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1 mb-4">
          {request.details.startDate && (
            <p><span className="text-gray-500">วันที่:</span> {request.details.startDate} {request.details.endDate !== request.details.startDate ? `→ ${request.details.endDate}` : ''}</p>
          )}
          {request.details.days && (
            <p><span className="text-gray-500">จำนวน:</span> {request.details.days} วัน</p>
          )}
          {request.details.date && (
            <p><span className="text-gray-500">วันที่:</span> {request.details.date}</p>
          )}
          <p><span className="text-gray-500">เหตุผล:</span> {request.details.reason}</p>
          {request.details.attachmentUrl && (
            <a href={request.details.attachmentUrl} target="_blank" rel="noreferrer" className="text-green-600 hover:underline">
              📎 ดูใบรับรองแพทย์
            </a>
          )}
        </div>

        <div className="mb-4">
          <label className="label">หมายเหตุ (ไม่บังคับ)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="input"
            placeholder="ระบุเหตุผลสำหรับผู้ยื่น..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handle('reject')}
            disabled={loading}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            ❌ ไม่อนุมัติ
          </button>
          <button
            onClick={() => handle('approve')}
            disabled={loading}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            ✓ อนุมัติ
          </button>
        </div>
        <button onClick={onClose} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3">
          ยกเลิก
        </button>
      </div>
    </div>
  )
}

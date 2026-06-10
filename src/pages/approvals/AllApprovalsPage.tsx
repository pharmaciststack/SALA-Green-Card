import { useEffect, useMemo, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { LeaveRequest, RequestStatus, RequestType } from '../../types'
import {
  approveByPharmacist, rejectByPharmacist,
  approveByManager, rejectByManager,
  approveByDirector, rejectByDirector,
} from '../../services/requestService'
import { useAuth } from '../../hooks/useAuth'
import RequestCard from '../../components/approval/RequestCard'
import ApprovalModal from '../../components/approval/ApprovalModal'
import { REQUEST_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, BRANCHES } from '../../utils/constants'

const PENDING_STATUSES: RequestStatus[] = [
  'pending_pharmacist',
  'pending_manager',
  'pending_director',
]

function toRequest(id: string, data: Record<string, unknown>): LeaveRequest {
  return {
    ...data,
    requestId: id,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate?.() ?? new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate?.() ?? new Date(),
  } as LeaveRequest
}

export default function AllApprovalsPage() {
  const { profile, role } = useAuth()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [selected, setSelected] = useState<LeaveRequest | null>(null)
  const [loading, setLoading] = useState(true)

  const [filterStatus, setFilterStatus] = useState<RequestStatus | ''>('')
  const [filterType, setFilterType] = useState<RequestType | ''>('')
  const [filterBranch, setFilterBranch] = useState('')

  useEffect(() => {
    const q = query(
      collection(db, 'requests'),
      where('status', 'in', PENDING_STATUSES),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => toRequest(d.id, d.data() as Record<string, unknown>)))
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filterStatus && r.status !== filterStatus) return false
      if (filterType && r.type !== filterType) return false
      if (filterBranch && r.areaId !== filterBranch) return false
      return true
    })
  }, [requests, filterStatus, filterType, filterBranch])

  const summary = useMemo(() => {
    return {
      pharmacist: requests.filter((r) => r.status === 'pending_pharmacist').length,
      manager:    requests.filter((r) => r.status === 'pending_manager').length,
      director:   requests.filter((r) => r.status === 'pending_director').length,
    }
  }, [requests])

  function canActOn(req: LeaveRequest): boolean {
    if (!profile) return false
    if (role === 'admin') return true
    // pharmacist and area_manager are equivalent — either can approve stages 1 and 2 in their area
    if ((role === 'pharmacist' || role === 'area_manager')
        && (req.status === 'pending_pharmacist' || req.status === 'pending_manager')
        && req.areaId === profile.areaId) return true
    if (role === 'director' && req.status === 'pending_director') return true
    return false
  }

  async function handleApprove(note: string) {
    if (!selected || !profile) return
    switch (selected.status) {
      case 'pending_pharmacist': await approveByPharmacist(selected.requestId, profile, note); break
      case 'pending_manager':    await approveByManager(selected.requestId, profile, note); break
      case 'pending_director':   await approveByDirector(selected.requestId, profile, note); break
    }
    setSelected(null)
  }

  async function handleReject(note: string) {
    if (!selected || !profile) return
    switch (selected.status) {
      case 'pending_pharmacist': await rejectByPharmacist(selected.requestId, profile, note); break
      case 'pending_manager':    await rejectByManager(selected.requestId, profile, note); break
      case 'pending_director':   await rejectByDirector(selected.requestId, profile, note); break
    }
    setSelected(null)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📋 ภาพรวมคำขอที่รออนุมัติ</h1>
          <p className="text-sm text-gray-500 mt-0.5">ทุกขั้นตอนการอนุมัติในที่เดียว</p>
        </div>
        <span className="text-sm text-gray-400">{filtered.length} / {requests.length}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilterStatus(filterStatus === 'pending_pharmacist' ? '' : 'pending_pharmacist')}
          className={`bg-white border rounded-xl p-3 text-left transition-all ${
            filterStatus === 'pending_pharmacist'
              ? 'border-yellow-400 ring-2 ring-yellow-200'
              : 'border-gray-100 hover:border-yellow-200'
          }`}
        >
          <p className="text-xs text-gray-500">รอเภสัช</p>
          <p className="text-2xl font-bold text-yellow-700">{summary.pharmacist}</p>
        </button>
        <button
          onClick={() => setFilterStatus(filterStatus === 'pending_manager' ? '' : 'pending_manager')}
          className={`bg-white border rounded-xl p-3 text-left transition-all ${
            filterStatus === 'pending_manager'
              ? 'border-blue-400 ring-2 ring-blue-200'
              : 'border-gray-100 hover:border-blue-200'
          }`}
        >
          <p className="text-xs text-gray-500">รอ Manager</p>
          <p className="text-2xl font-bold text-blue-700">{summary.manager}</p>
        </button>
        <button
          onClick={() => setFilterStatus(filterStatus === 'pending_director' ? '' : 'pending_director')}
          className={`bg-white border rounded-xl p-3 text-left transition-all ${
            filterStatus === 'pending_director'
              ? 'border-purple-400 ring-2 ring-purple-200'
              : 'border-gray-100 hover:border-purple-200'
          }`}
        >
          <p className="text-xs text-gray-500">รอ ผอ.</p>
          <p className="text-2xl font-bold text-purple-700">{summary.director}</p>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as RequestType | '')}
          className="border-[1.5px] border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-600"
        >
          <option value="">ทุกประเภท</option>
          {(Object.keys(REQUEST_TYPE_LABELS) as RequestType[]).map((t) => (
            <option key={t} value={t}>{REQUEST_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="border-[1.5px] border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-600"
        >
          <option value="">ทุกสาขา</option>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        {(filterStatus || filterType || filterBranch) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterType(''); setFilterBranch('') }}
            className="text-sm text-gray-500 hover:text-gray-700 px-2"
          >
            ล้างตัวกรอง ✕
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl">
          <p className="text-4xl mb-3">✅</p>
          <p>ไม่มีคำขอที่ตรงตามเงื่อนไข</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const actionable = canActOn(r)
            return (
              <div key={r.requestId} className="relative">
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
                <div className={!actionable ? 'opacity-60' : ''}>
                  <RequestCard
                    request={r}
                    onReview={() => actionable ? setSelected(r) : undefined}
                  />
                </div>
                {!actionable && (
                  <p className="text-[10px] text-gray-400 text-right mt-1 pr-2">
                    {role === 'pharmacist' || role === 'area_manager'
                      ? 'ไม่อยู่ในสาขาของคุณ หรือไม่ใช่ขั้นตอนของคุณ'
                      : 'ไม่ใช่ขั้นตอนของคุณ'}
                  </p>
                )}
              </div>
            )
          })}
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

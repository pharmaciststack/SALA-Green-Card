import {
  collection, doc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp, runTransaction,
  Unsubscribe
} from 'firebase/firestore'
import { db } from './firebase'
import { LeaveRequest, RequestType, RequestStatus, RequestDetails, UserProfile } from '../types'
import { getCurrentMonthKey } from '../utils/businessRules'
import { COMBINED_COUNTER_MONTH_LIMIT, COMBINED_COUNTER_YEAR_LIMIT } from '../utils/constants'
import { writeAuditLog } from './auditLogService'
import { resolveChainForRole, stageToStatus } from './approvalFlowService'
import { ApprovalStage } from '../types'

function toRequest(id: string, data: Record<string, unknown>): LeaveRequest {
  return {
    ...data,
    requestId: id,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate(),
    pharmacistApproval: data.pharmacistApproval
      ? { ...(data.pharmacistApproval as object), timestamp: (data.pharmacistApproval as { timestamp: { toDate: () => Date } }).timestamp?.toDate() }
      : undefined,
    managerApproval: data.managerApproval
      ? { ...(data.managerApproval as object), timestamp: (data.managerApproval as { timestamp: { toDate: () => Date } }).timestamp?.toDate() }
      : undefined,
    directorApproval: data.directorApproval
      ? { ...(data.directorApproval as object), timestamp: (data.directorApproval as { timestamp: { toDate: () => Date } }).timestamp?.toDate() }
      : undefined,
  } as LeaveRequest
}

export async function createRequest(
  profile: UserProfile,
  type: RequestType,
  details: RequestDetails
): Promise<string> {
  const isCombined = type === 'change_day_off' || type === 'late'
  const year = new Date().getFullYear()
  const reqRef = doc(collection(db, 'requests'))
  // Resolve the submitter's approval chain and start at its first stage.
  const chain = resolveChainForRole(profile.role)
  const initialStatus = stageToStatus(chain[0])

  await runTransaction(db, async (tx) => {
    if (isCombined) {
      const statsRef = doc(db, 'attendance_stats', `${profile.uid}_${year}`)
      const statsSnap = await tx.get(statsRef)
      if (statsSnap.exists()) {
        const stats = statsSnap.data()
        const monthKey = getCurrentMonthKey()
        const monthCount = stats.combined_counter_month_key === monthKey
          ? stats.combined_counter_month
          : 0
        if (monthCount >= COMBINED_COUNTER_MONTH_LIMIT) throw new Error('COMBINED_MONTH_LIMIT')
        if ((stats.combined_counter_year ?? 0) >= COMBINED_COUNTER_YEAR_LIMIT) throw new Error('COMBINED_YEAR_LIMIT')
        tx.update(statsRef, {
          combined_counter_month: monthCount + 1,
          combined_counter_month_key: monthKey,
          combined_counter_year: (stats.combined_counter_year ?? 0) + 1,
        })
      }
    }

    tx.set(reqRef, {
      type,
      submittedBy: profile.uid,
      submitterName: profile.displayName ?? '',
      submitterEmail: profile.email ?? '',
      areaId: profile.areaId || profile.branchName,
      status: initialStatus,
      chain,
      details,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  return reqRef.id
}

const STAGE_FIELD: Record<ApprovalStage, 'pharmacistApproval' | 'managerApproval' | 'directorApproval'> = {
  pharmacist: 'pharmacistApproval',
  manager: 'managerApproval',
  director: 'directorApproval',
}

// Apply an approve/reject at the given stage and advance along the request's
// stored chain. On approval of the last stage the request becomes 'approved'.
async function applyApproval(
  requestId: string,
  stage: ApprovalStage,
  approver: UserProfile,
  action: 'approved' | 'rejected',
  note: string
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const reqRef = doc(db, 'requests', requestId)
    const snap = await tx.get(reqRef)
    if (!snap.exists()) throw new Error('Request not found')
    const data = snap.data()

    // Legacy requests may not have a chain — fall back to the full sequence.
    const chain: ApprovalStage[] = Array.isArray(data.chain) && data.chain.length
      ? (data.chain as ApprovalStage[])
      : ['pharmacist', 'manager', 'director']
    const idx = chain.indexOf(stage)
    const nextStage = idx >= 0 ? chain[idx + 1] : undefined
    const status: RequestStatus = action === 'rejected'
      ? 'rejected'
      : nextStage ? stageToStatus(nextStage) : 'approved'

    const approval = {
      uid: approver.uid,
      name: approver.displayName,
      action,
      note,
      timestamp: serverTimestamp(),
    }

    tx.update(reqRef, {
      status,
      [STAGE_FIELD[stage]]: approval,
      updatedAt: serverTimestamp(),
    })

    // If final approval, decrement quota
    if (status === 'approved') {
      const req = data
      const year = new Date().getFullYear()
      const quotaRef = doc(db, 'leave_quotas', `${req.submittedBy}_${year}`)
      const qsnap = await tx.get(quotaRef)
      if (qsnap.exists()) {
        const quota = qsnap.data()
        const days = req.details?.days ?? 0
        if (req.type === 'personal_leave') {
          tx.update(quotaRef, { personal_used: (quota.personal_used ?? 0) + days })
        } else if (req.type === 'sick_leave') {
          tx.update(quotaRef, { sick_used: (quota.sick_used ?? 0) + days })
        } else if (req.type === 'vacation') {
          tx.update(quotaRef, { vacation_used: (quota.vacation_used ?? 0) + days })
        }
        // Update attendance stats
        if (days > 0) {
          const statsRef = doc(db, 'attendance_stats', `${req.submittedBy}_${year}`)
          const ssnap = await tx.get(statsRef)
          if (ssnap.exists()) {
            tx.update(statsRef, { leaves_taken: (ssnap.data().leaves_taken ?? 0) + days })
          }
        }
      }
    }
  })
}

export const approveByPharmacist = (id: string, approver: UserProfile, note: string) =>
  applyApproval(id, 'pharmacist', approver, 'approved', note)

export const rejectByPharmacist = (id: string, approver: UserProfile, note: string) =>
  applyApproval(id, 'pharmacist', approver, 'rejected', note)

export const approveByManager = (id: string, approver: UserProfile, note: string) =>
  applyApproval(id, 'manager', approver, 'approved', note)

export const rejectByManager = (id: string, approver: UserProfile, note: string) =>
  applyApproval(id, 'manager', approver, 'rejected', note)

export const approveByDirector = async (id: string, approver: UserProfile, note: string) => {
  const req = await getRequest(id)
  await applyApproval(id, 'director', approver, 'approved', note)
  await writeAuditLog(
    approver,
    'request_approved',
    { requestId: id, type: req?.type, note, days: req?.details?.days },
    req ? { uid: req.submittedBy, name: req.submitterName } : undefined
  )
}

export const rejectByDirector = async (id: string, approver: UserProfile, note: string) => {
  const req = await getRequest(id)
  await applyApproval(id, 'director', approver, 'rejected', note)
  await writeAuditLog(
    approver,
    'request_rejected',
    { requestId: id, type: req?.type, note },
    req ? { uid: req.submittedBy, name: req.submitterName } : undefined
  )
}

export async function getRequest(id: string): Promise<LeaveRequest | null> {
  const snap = await getDoc(doc(db, 'requests', id))
  if (!snap.exists()) return null
  return toRequest(snap.id, snap.data() as Record<string, unknown>)
}

export function listenMyRequests(uid: string, callback: (reqs: LeaveRequest[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'requests'),
    where('submittedBy', '==', uid),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => toRequest(d.id, d.data() as Record<string, unknown>)))
  })
}

export function listenPharmacistInbox(areaId: string, callback: (reqs: LeaveRequest[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'requests'),
    where('areaId', '==', areaId),
    where('status', '==', 'pending_pharmacist'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => toRequest(d.id, d.data() as Record<string, unknown>)))
  })
}

export function listenManagerInbox(areaId: string, callback: (reqs: LeaveRequest[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'requests'),
    where('areaId', '==', areaId),
    where('status', '==', 'pending_manager'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => toRequest(d.id, d.data() as Record<string, unknown>)))
  })
}

export function listenDirectorInbox(callback: (reqs: LeaveRequest[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'requests'),
    where('status', '==', 'pending_director'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => toRequest(d.id, d.data() as Record<string, unknown>)))
  })
}

export async function getPharmacistHistory(uid: string): Promise<LeaveRequest[]> {
  const q = query(
    collection(db, 'requests'),
    where('pharmacistApproval.uid', '==', uid),
    orderBy('updatedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => toRequest(d.id, d.data() as Record<string, unknown>))
}

export async function getManagerHistory(uid: string): Promise<LeaveRequest[]> {
  const q = query(
    collection(db, 'requests'),
    where('managerApproval.uid', '==', uid),
    orderBy('updatedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => toRequest(d.id, d.data() as Record<string, unknown>))
}

export async function getDirectorHistory(uid: string): Promise<LeaveRequest[]> {
  const q = query(
    collection(db, 'requests'),
    where('directorApproval.uid', '==', uid),
    orderBy('updatedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => toRequest(d.id, d.data() as Record<string, unknown>))
}

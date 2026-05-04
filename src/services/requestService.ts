import {
  collection, doc, addDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp, runTransaction,
  Unsubscribe
} from 'firebase/firestore'
import { db } from './firebase'
import { LeaveRequest, RequestType, RequestStatus, RequestDetails, UserProfile } from '../types'
import { getCurrentMonthKey } from '../utils/businessRules'

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

  if (isCombined) {
    // Check combined counter limits
    const statsRef = doc(db, 'attendance_stats', `${profile.uid}_${new Date().getFullYear()}`)
    const statsSnap = await getDoc(statsRef)
    if (statsSnap.exists()) {
      const stats = statsSnap.data()
      const monthKey = getCurrentMonthKey()
      const currentMonthKey = stats.combined_counter_month_key
      const monthCount = currentMonthKey === monthKey ? stats.combined_counter_month : 0
      if (monthCount >= 2) throw new Error('COMBINED_MONTH_LIMIT')
      if (stats.combined_counter_year >= 12) throw new Error('COMBINED_YEAR_LIMIT')
    }
  }

  const ref = await addDoc(collection(db, 'requests'), {
    type,
    submittedBy: profile.uid,
    submitterName: profile.displayName,
    submitterEmail: profile.email,
    areaId: profile.areaId || profile.branchName,
    status: 'pending_pharmacist' as RequestStatus,
    details,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Increment combined counter
  if (isCombined) {
    const statsRef = doc(db, 'attendance_stats', `${profile.uid}_${new Date().getFullYear()}`)
    const monthKey = getCurrentMonthKey()
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(statsRef)
      if (!snap.exists()) return
      const data = snap.data()
      const currentMonthKey = data.combined_counter_month_key
      const monthCount = currentMonthKey === monthKey ? data.combined_counter_month : 0
      tx.update(statsRef, {
        combined_counter_month: monthCount + 1,
        combined_counter_month_key: monthKey,
        combined_counter_year: (data.combined_counter_year ?? 0) + 1,
      })
    })
  }

  return ref.id
}

async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
  approvalField: 'pharmacistApproval' | 'managerApproval' | 'directorApproval',
  approver: UserProfile,
  action: 'approved' | 'rejected',
  note: string
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const reqRef = doc(db, 'requests', requestId)
    const snap = await tx.get(reqRef)
    if (!snap.exists()) throw new Error('Request not found')

    const approval = {
      uid: approver.uid,
      name: approver.displayName,
      action,
      note,
      timestamp: serverTimestamp(),
    }

    tx.update(reqRef, {
      status,
      [approvalField]: approval,
      updatedAt: serverTimestamp(),
    })

    // If final approval, decrement quota
    if (status === 'approved') {
      const req = snap.data()
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
  updateRequestStatus(id, 'pending_manager', 'pharmacistApproval', approver, 'approved', note)

export const rejectByPharmacist = (id: string, approver: UserProfile, note: string) =>
  updateRequestStatus(id, 'rejected', 'pharmacistApproval', approver, 'rejected', note)

export const approveByManager = (id: string, approver: UserProfile, note: string) =>
  updateRequestStatus(id, 'pending_director', 'managerApproval', approver, 'approved', note)

export const rejectByManager = (id: string, approver: UserProfile, note: string) =>
  updateRequestStatus(id, 'rejected', 'managerApproval', approver, 'rejected', note)

export const approveByDirector = (id: string, approver: UserProfile, note: string) =>
  updateRequestStatus(id, 'approved', 'directorApproval', approver, 'approved', note)

export const rejectByDirector = (id: string, approver: UserProfile, note: string) =>
  updateRequestStatus(id, 'rejected', 'directorApproval', approver, 'rejected', note)

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

import { doc, onSnapshot, getDoc, setDoc, Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import { LeaveQuota, AttendanceStats } from '../types'

export function listenQuota(uid: string, year: number, callback: (q: LeaveQuota | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'leave_quotas', `${uid}_${year}`), (snap) => {
    callback(snap.exists() ? (snap.data() as LeaveQuota) : null)
  })
}

export function listenStats(uid: string, year: number, callback: (s: AttendanceStats | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'attendance_stats', `${uid}_${year}`), (snap) => {
    callback(snap.exists() ? (snap.data() as AttendanceStats) : null)
  })
}

export async function updateQuota(uid: string, year: number, data: Partial<LeaveQuota>): Promise<void> {
  await setDoc(doc(db, 'leave_quotas', `${uid}_${year}`), data, { merge: true })
}

export async function getQuota(uid: string, year: number): Promise<LeaveQuota | null> {
  const snap = await getDoc(doc(db, 'leave_quotas', `${uid}_${year}`))
  return snap.exists() ? (snap.data() as LeaveQuota) : null
}

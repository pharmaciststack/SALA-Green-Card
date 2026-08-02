import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, Unsubscribe } from 'firebase/firestore'
import { auth, db } from './firebase'
import { UserProfile } from '../types'
import { getCachedSettings } from './settingsService'

const provider = new GoogleAuthProvider()

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, provider)
}

export async function handleRedirectResult(): Promise<void> {
  // no-op for popup flow
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

function mapProfile(data: Record<string, unknown>): UserProfile {
  return {
    ...data,
    createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.(),
    updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate?.(),
  } as UserProfile
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? mapProfile(snap.data()) : null
}

/** Live subscription to the user's own profile so role/group changes reflect immediately. */
export function listenUserProfile(uid: string, callback: (p: UserProfile | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    callback(snap.exists() ? mapProfile(snap.data()) : null)
  })
}

export async function createOrUpdateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      role: 'employee',
      areaId: '',
      branchName: '',
      employeeCode: '',
      department: '',
      isProfileComplete: false,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else {
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
  }
}

export async function completeRegistration(
  uid: string,
  email: string,
  photoURL: string,
  displayName: string,
  branchName: string,
  department: string,
  employeeCode: string,
  position: string
): Promise<void> {
  await createOrUpdateUserProfile(uid, {
    email,
    photoURL,
    displayName,
    branchName,
    department,
    employeeCode,
    position,
    isProfileComplete: true,
  })
  // seed default quota
  const year = new Date().getFullYear()
  const quotaRef = doc(db, 'leave_quotas', `${uid}_${year}`)
  const qsnap = await getDoc(quotaRef)
  if (!qsnap.exists()) {
    const s = getCachedSettings()
    await setDoc(quotaRef, {
      uid,
      year,
      personal_total: s.defaultPersonalDays,
      personal_used: 0,
      sick_total: s.defaultSickDays,
      sick_used: 0,
      vacation_total: s.defaultVacationDays,
      vacation_used: 0,
      weekly_off_accumulated: 0,
    })
  }
  // seed attendance stats
  const statsRef = doc(db, 'attendance_stats', `${uid}_${year}`)
  const ssnap = await getDoc(statsRef)
  if (!ssnap.exists()) {
    await setDoc(statsRef, {
      uid,
      year,
      absences: 0,
      tardiness_minutes: 0,
      leaves_taken: 0,
      combined_counter_month: 0,
      combined_counter_year: 0,
      combined_counter_month_key: '',
    })
  }
}

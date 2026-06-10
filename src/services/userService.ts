import { collection, doc, getDocs, setDoc, query, orderBy } from 'firebase/firestore'
import { db } from './firebase'
import { UserProfile, UserRole } from '../types'
import { writeAuditLog } from './auditLogService'

export async function getAllUsers(): Promise<UserProfile[]> {
  const q = query(collection(db, 'users'), orderBy('displayName'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as UserProfile
  })
}

export async function updateUserRole(
  uid: string,
  role: UserRole,
  areaId: string,
  actor?: UserProfile,
  target?: { name: string; previousRole: UserRole }
): Promise<void> {
  await setDoc(doc(db, 'users', uid), { role, areaId }, { merge: true })

  if (actor && target) {
    await writeAuditLog(
      actor,
      'role_change',
      { previousRole: target.previousRole, newRole: role, areaId },
      { uid, name: target.name }
    )
  }
}

import {
  collection, addDoc, query, orderBy, limit, getDocs, where, serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { AuditLog, AuditAction, UserProfile } from '../types'

export async function writeAuditLog(
  actor: UserProfile,
  action: AuditAction,
  details: Record<string, unknown>,
  target?: { uid: string; name: string }
): Promise<void> {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      actorUid: actor.uid,
      actorName: actor.displayName,
      actorRole: actor.role,
      targetUid: target?.uid ?? null,
      targetName: target?.name ?? null,
      details,
      createdAt: serverTimestamp(),
    })
  } catch (err) {
    // Logging failures should never block the underlying action
    console.error('Failed to write audit log:', err)
  }
}

function toLog(id: string, data: Record<string, unknown>): AuditLog {
  return {
    logId: id,
    action: data.action as AuditAction,
    actorUid: data.actorUid as string,
    actorName: data.actorName as string,
    actorRole: data.actorRole as AuditLog['actorRole'],
    targetUid: (data.targetUid as string) || undefined,
    targetName: (data.targetName as string) || undefined,
    details: (data.details as Record<string, unknown>) ?? {},
    createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(),
  }
}

export async function listAuditLogs(opts?: {
  actorRole?: 'admin' | 'director'
  limitCount?: number
}): Promise<AuditLog[]> {
  const constraints = []
  if (opts?.actorRole) constraints.push(where('actorRole', '==', opts.actorRole))
  constraints.push(orderBy('createdAt', 'desc'))
  constraints.push(limit(opts?.limitCount ?? 200))

  const q = query(collection(db, 'audit_logs'), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((d) => toLog(d.id, d.data() as Record<string, unknown>))
}

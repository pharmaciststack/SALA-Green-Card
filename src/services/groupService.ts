import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, deleteDoc,
  serverTimestamp, Timestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from './firebase'
import { EmployeeGroup, GroupSettings, UserProfile } from '../types'
import { getCachedSettings, applyGroupToCache, DEFAULT_SETTINGS, NUMERIC_SETTING_KEYS } from './settingsService'
import { writeAuditLog } from './auditLogService'

const GROUPS = collection(db, 'employee_groups')

/** Numeric defaults for a brand-new group (copied from the org-wide config). */
export function defaultGroupSettings(): GroupSettings {
  const base = getCachedSettings()
  const out = {} as Record<string, unknown>
  for (const k of NUMERIC_SETTING_KEYS) {
    out[k] = base[k] ?? DEFAULT_SETTINGS[k]
  }
  return out as unknown as GroupSettings
}

function toGroup(id: string, data: Record<string, unknown>): EmployeeGroup {
  const g = { id, name: (data.name as string) ?? '' } as unknown as Record<string, unknown>
  for (const k of NUMERIC_SETTING_KEYS) {
    g[k] = (data[k] as number) ?? DEFAULT_SETTINGS[k]
  }
  g.createdAt = (data.createdAt as Timestamp)?.toDate?.()
  g.updatedAt = (data.updatedAt as Timestamp)?.toDate?.()
  return g as unknown as EmployeeGroup
}

export async function listGroups(): Promise<EmployeeGroup[]> {
  const snap = await getDocs(query(GROUPS, orderBy('name')))
  return snap.docs.map((d) => toGroup(d.id, d.data() as Record<string, unknown>))
}

export async function createGroup(name: string, actor?: UserProfile): Promise<string> {
  const ref = await addDoc(GROUPS, {
    name,
    ...defaultGroupSettings(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  if (actor) await writeAuditLog(actor, 'group_update', { action: 'create', name, groupId: ref.id })
  return ref.id
}

export async function updateGroup(group: EmployeeGroup, actor?: UserProfile): Promise<void> {
  const { id, createdAt: _c, updatedAt: _u, ...payload } = group
  await setDoc(doc(db, 'employee_groups', id), { ...payload, updatedAt: serverTimestamp() }, { merge: true })
  if (actor) await writeAuditLog(actor, 'group_update', { action: 'edit', name: group.name, groupId: id })
}

export async function deleteGroup(id: string, name: string, actor?: UserProfile): Promise<void> {
  await deleteDoc(doc(db, 'employee_groups', id))
  if (actor) await writeAuditLog(actor, 'group_update', { action: 'delete', name, groupId: id })
}

/**
 * Resolve the signed-in user's group into the settings cache so synchronous
 * business-rule helpers evaluate against that group's values. Falls back to the
 * org-wide config when the user has no group. Never throws.
 */
export async function applyUserGroup(groupId?: string | null): Promise<void> {
  if (!groupId) return // keep org-wide defaults already in cache
  try {
    const snap = await getDoc(doc(db, 'employee_groups', groupId))
    if (!snap.exists()) return
    applyGroupToCache(toGroup(snap.id, snap.data() as Record<string, unknown>))
  } catch {
    // keep org-wide defaults
  }
}

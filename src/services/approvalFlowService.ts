import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import { ApprovalFlowConfig, ApprovalStage, FlowSlot, RequestStatus, UserProfile, UserRole } from '../types'
import { writeAuditLog } from './auditLogService'

const FLOW_DOC = doc(db, 'system_settings', 'approval_flow')

// Each role has 3 boxes; each box picks an approver stage or 'bypass'.
// Default: employee → เภสัช→Area→ผอ.; เภสัช → Area→ผอ.; Area → ผอ.
export const DEFAULT_FLOW: ApprovalFlowConfig = {
  employee:     { slots: ['pharmacist', 'manager', 'director'] },
  pharmacist:   { slots: ['manager', 'director', 'bypass'] },
  area_manager: { slots: ['director', 'bypass', 'bypass'] },
}

const STAGE_ORDER: ApprovalStage[] = ['pharmacist', 'manager', 'director']

let cache: ApprovalFlowConfig = DEFAULT_FLOW

export function getCachedFlow(): ApprovalFlowConfig {
  return cache
}

export function stageToStatus(stage: ApprovalStage): RequestStatus {
  return stage === 'pharmacist' ? 'pending_pharmacist'
    : stage === 'manager' ? 'pending_manager'
    : 'pending_director'
}

/**
 * Turn a role's 3 boxes into an ordered approval chain: drop 'bypass', keep the
 * chosen stages in hierarchy order (pharmacist→manager→director), de-duplicate,
 * and always guarantee director is the final approver (ผอ. อนุมัติทุกคน).
 */
export function resolveChain(slots: FlowSlot[]): ApprovalStage[] {
  const picked = new Set<ApprovalStage>()
  for (const s of slots) {
    if (s !== 'bypass') picked.add(s)
  }
  picked.add('director')
  return STAGE_ORDER.filter((s) => picked.has(s))
}

export function resolveChainForRole(role: UserRole): ApprovalStage[] {
  const rf = (cache as unknown as Record<string, unknown>)[role] as { slots: FlowSlot[] } | undefined
  if (!rf) return ['director'] // director/admin/super_admin → straight to ผอ.
  return resolveChain(rf.slots)
}

export function getInitialStatusFor(role: UserRole): RequestStatus {
  return stageToStatus(resolveChainForRole(role)[0])
}

function normalize(data: Record<string, unknown>): ApprovalFlowConfig {
  return {
    ...DEFAULT_FLOW,
    ...data,
    updatedAt: (data.updatedAt as Timestamp)?.toDate?.(),
  } as ApprovalFlowConfig
}

export async function getFlow(): Promise<ApprovalFlowConfig> {
  const snap = await getDoc(FLOW_DOC)
  if (snap.exists()) cache = normalize(snap.data() as Record<string, unknown>)
  return cache
}

export async function primeFlow(): Promise<ApprovalFlowConfig> {
  try {
    return await getFlow()
  } catch {
    return cache
  }
}

export async function updateFlow(next: ApprovalFlowConfig, actor?: UserProfile): Promise<void> {
  const { updatedAt: _omit, ...payload } = next
  await setDoc(
    FLOW_DOC,
    { ...payload, updatedAt: serverTimestamp(), updatedByName: actor?.displayName ?? null },
    { merge: true }
  )
  cache = { ...next }
  if (actor) {
    await writeAuditLog(actor, 'settings_update', {
      kind: 'approval_flow',
      employee: resolveChain(next.employee.slots).join('>'),
      pharmacist: resolveChain(next.pharmacist.slots).join('>'),
      area_manager: resolveChain(next.area_manager.slots).join('>'),
    })
  }
}

import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, Timestamp, Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import { SystemSettings, GroupSettings, UserProfile } from '../types'
import { writeAuditLog } from './auditLogService'

// The numeric settings that can differ per employee group.
export const NUMERIC_SETTING_KEYS: (keyof GroupSettings)[] = [
  'combinedCounterMonthLimit',
  'combinedCounterYearLimit',
  'tardinessBonusThreshold',
  'vacationAdvanceDays',
  'vacationMaxConsecutive',
  'sickCertRequiredDays',
  'defaultSickDays',
  'defaultPersonalDays',
  'defaultVacationDays',
  'defaultWeeklyOffMax',
]
import {
  COMBINED_COUNTER_MONTH_LIMIT,
  COMBINED_COUNTER_YEAR_LIMIT,
  TARDINESS_BONUS_THRESHOLD,
  VACATION_ADVANCE_DAYS,
  SICK_CERT_REQUIRED_DAYS,
  DEFAULT_SICK_DAYS,
  DEFAULT_PERSONAL_DAYS,
  DEFAULT_VACATION_DAYS,
  DEFAULT_WEEKLY_OFF_MAX,
  THAI_PUBLIC_HOLIDAYS_2026,
} from '../utils/constants'

const SETTINGS_DOC = doc(db, 'system_settings', 'config')

// Baseline used until Firestore settings load, and as the seed on first save.
export const DEFAULT_SETTINGS: SystemSettings = {
  combinedCounterMonthLimit: COMBINED_COUNTER_MONTH_LIMIT,
  combinedCounterYearLimit: COMBINED_COUNTER_YEAR_LIMIT,
  tardinessBonusThreshold: TARDINESS_BONUS_THRESHOLD,
  vacationAdvanceDays: VACATION_ADVANCE_DAYS,
  vacationMaxConsecutive: 10,
  sickCertRequiredDays: SICK_CERT_REQUIRED_DAYS,
  defaultSickDays: DEFAULT_SICK_DAYS,
  defaultPersonalDays: DEFAULT_PERSONAL_DAYS,
  defaultVacationDays: DEFAULT_VACATION_DAYS,
  defaultWeeklyOffMax: DEFAULT_WEEKLY_OFF_MAX,
  holidays: THAI_PUBLIC_HOLIDAYS_2026,
}

// Module-level cache so synchronous business-rule helpers can read live settings
// without threading them through every call site.
let cache: SystemSettings = DEFAULT_SETTINGS

export function getCachedSettings(): SystemSettings {
  return cache
}

// Overwrite the cache with a group's numeric settings while keeping the
// org-wide holiday calendar. Used to resolve the signed-in user's group.
export function applyGroupToCache(group: GroupSettings): void {
  const merged = { ...cache } as unknown as Record<string, unknown>
  for (const k of NUMERIC_SETTING_KEYS) {
    merged[k] = group[k]
  }
  cache = merged as unknown as SystemSettings
}

function normalize(data: Record<string, unknown>): SystemSettings {
  // Merge with defaults so a partially-written doc never yields undefined values
  return {
    ...DEFAULT_SETTINGS,
    ...data,
    holidays: Array.isArray(data.holidays) ? (data.holidays as string[]) : DEFAULT_SETTINGS.holidays,
    updatedAt: (data.updatedAt as Timestamp)?.toDate?.(),
  }
}

export async function getSettings(): Promise<SystemSettings> {
  const snap = await getDoc(SETTINGS_DOC)
  if (snap.exists()) {
    cache = normalize(snap.data() as Record<string, unknown>)
  }
  return cache
}

/** Fetch once at app start to warm the cache. Never throws. */
export async function primeSettings(): Promise<SystemSettings> {
  try {
    return await getSettings()
  } catch {
    return cache
  }
}

/** Live subscription — keeps the cache fresh and notifies the caller. */
export function listenSettings(callback: (s: SystemSettings) => void): Unsubscribe {
  return onSnapshot(SETTINGS_DOC, (snap) => {
    if (snap.exists()) {
      cache = normalize(snap.data() as Record<string, unknown>)
    }
    callback(cache)
  })
}

export async function updateSettings(
  next: SystemSettings,
  actor?: UserProfile
): Promise<void> {
  const { updatedAt: _omit, ...payload } = next
  await setDoc(
    SETTINGS_DOC,
    { ...payload, updatedAt: serverTimestamp(), updatedByName: actor?.displayName ?? null },
    { merge: true }
  )
  cache = { ...next }

  if (actor) {
    await writeAuditLog(actor, 'settings_update', {
      combinedCounterMonthLimit: next.combinedCounterMonthLimit,
      combinedCounterYearLimit: next.combinedCounterYearLimit,
      tardinessBonusThreshold: next.tardinessBonusThreshold,
      vacationAdvanceDays: next.vacationAdvanceDays,
      sickCertRequiredDays: next.sickCertRequiredDays,
      holidayCount: next.holidays.length,
    })
  }
}

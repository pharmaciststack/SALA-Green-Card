import { AttendanceStats, LeaveQuota } from '../types'
import { getCachedSettings } from '../services/settingsService'

export function checkCombinedCounterMonth(stats: AttendanceStats): {
  allowed: boolean
  warn: boolean
  message: string
} {
  const { combinedCounterMonthLimit } = getCachedSettings()
  const count = stats.combined_counter_month
  if (count >= combinedCounterMonthLimit) {
    return {
      allowed: false,
      warn: false,
      message: `คุณใช้สิทธิ์เปลี่ยนวันหยุด/มาสาย/ออกก่อนเวลาครบ ${combinedCounterMonthLimit} ครั้งในเดือนนี้แล้ว ไม่สามารถยื่นคำขอได้`,
    }
  }
  if (count === combinedCounterMonthLimit - 1) {
    return {
      allowed: true,
      warn: true,
      message: `คำเตือน: คุณจะใช้ครบสิทธิ์ ${combinedCounterMonthLimit} ครั้ง/เดือน เมื่อยื่นคำขอนี้`,
    }
  }
  return { allowed: true, warn: false, message: '' }
}

export function checkCombinedCounterYear(stats: AttendanceStats): {
  allowed: boolean
  message: string
} {
  const { combinedCounterYearLimit } = getCachedSettings()
  if (stats.combined_counter_year >= combinedCounterYearLimit) {
    return {
      allowed: false,
      message: `คุณใช้สิทธิ์ครบ ${combinedCounterYearLimit} ครั้ง/ปีแล้ว ไม่สามารถยื่นคำขอได้`,
    }
  }
  return { allowed: true, message: '' }
}

export function requiresDoctorCert(days: number): boolean {
  return days >= getCachedSettings().sickCertRequiredDays
}

export function checkVacationAdvanceNotice(startDate: string): {
  sufficient: boolean
  daysAhead: number
  message: string
} {
  const { vacationAdvanceDays } = getCachedSettings()
  const today = new Date()
  const start = new Date(startDate)
  const diffMs = start.getTime() - today.getTime()
  const daysAhead = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (daysAhead < vacationAdvanceDays) {
    return {
      sufficient: false,
      daysAhead,
      message: `ต้องยื่นล่วงหน้าอย่างน้อย ${vacationAdvanceDays} วัน (คุณยื่นล่วงหน้า ${daysAhead} วัน)`,
    }
  }
  return { sufficient: true, daysAhead, message: '' }
}

export function checkVacationQuota(quota: LeaveQuota, days: number): {
  sufficient: boolean
  remaining: number
  message: string
} {
  const remaining = quota.vacation_total - quota.vacation_used
  if (days > remaining) {
    return {
      sufficient: false,
      remaining,
      message: `วันลาพักร้อนคงเหลือ ${remaining} วัน ไม่เพียงพอ (ขอ ${days} วัน)`,
    }
  }
  return { sufficient: true, remaining, message: '' }
}

export function checkVacationMonthLimit(days: number): {
  allowed: boolean
  message: string
} {
  const { vacationMaxConsecutive } = getCachedSettings()
  if (days > vacationMaxConsecutive) {
    return {
      allowed: false,
      message: `ลาพักร้อนต่อเนื่องได้ไม่เกิน ${vacationMaxConsecutive} วัน/ครั้ง`,
    }
  }
  return { allowed: true, message: '' }
}

export function getTardinessStatus(accumulatedMinutes: number): {
  level: 'ok' | 'warn' | 'over'
  label: string
  loseGoodBehaviorBonus: boolean
  losePickingFee: boolean
} {
  const { tardinessBonusThreshold } = getCachedSettings()
  if (accumulatedMinutes === 0) {
    return { level: 'ok', label: 'ปกติ', loseGoodBehaviorBonus: false, losePickingFee: false }
  }
  if (accumulatedMinutes <= tardinessBonusThreshold) {
    return {
      level: 'warn',
      label: `สาย ${accumulatedMinutes} นาที/เดือน`,
      loseGoodBehaviorBonus: true,
      losePickingFee: false,
    }
  }
  return {
    level: 'over',
    label: `สายสะสม ${accumulatedMinutes} นาที/เดือน (เกินกำหนด)`,
    loseGoodBehaviorBonus: true,
    losePickingFee: true,
  }
}

export function countBusinessDays(startDate: string, endDate: string): number {
  const holidays = getCachedSettings().holidays
  const start = new Date(startDate)
  const end = new Date(endDate)
  let count = 0
  const current = new Date(start)
  while (current <= end) {
    const dayOfWeek = current.getDay()
    const dateStr = current.toISOString().split('T')[0]
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = holidays.includes(dateStr)
    if (!isWeekend && !isHoliday) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

export function getCurrentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

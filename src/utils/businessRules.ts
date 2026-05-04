import { AttendanceStats, LeaveQuota } from '../types'
import {
  COMBINED_COUNTER_MONTH_LIMIT,
  COMBINED_COUNTER_YEAR_LIMIT,
  TARDINESS_BONUS_THRESHOLD,
  VACATION_ADVANCE_DAYS,
  SICK_CERT_REQUIRED_DAYS,
  THAI_PUBLIC_HOLIDAYS_2026,
} from './constants'

export function checkCombinedCounterMonth(stats: AttendanceStats): {
  allowed: boolean
  warn: boolean
  message: string
} {
  const count = stats.combined_counter_month
  if (count >= COMBINED_COUNTER_MONTH_LIMIT) {
    return {
      allowed: false,
      warn: false,
      message: `คุณใช้สิทธิ์เปลี่ยนวันหยุด/มาสาย/ออกก่อนเวลาครบ ${COMBINED_COUNTER_MONTH_LIMIT} ครั้งในเดือนนี้แล้ว ไม่สามารถยื่นคำขอได้`,
    }
  }
  if (count === COMBINED_COUNTER_MONTH_LIMIT - 1) {
    return {
      allowed: true,
      warn: true,
      message: `คำเตือน: คุณจะใช้ครบสิทธิ์ ${COMBINED_COUNTER_MONTH_LIMIT} ครั้ง/เดือน เมื่อยื่นคำขอนี้`,
    }
  }
  return { allowed: true, warn: false, message: '' }
}

export function checkCombinedCounterYear(stats: AttendanceStats): {
  allowed: boolean
  message: string
} {
  if (stats.combined_counter_year >= COMBINED_COUNTER_YEAR_LIMIT) {
    return {
      allowed: false,
      message: `คุณใช้สิทธิ์ครบ ${COMBINED_COUNTER_YEAR_LIMIT} ครั้ง/ปีแล้ว ไม่สามารถยื่นคำขอได้`,
    }
  }
  return { allowed: true, message: '' }
}

export function requiresDoctorCert(days: number): boolean {
  return days >= SICK_CERT_REQUIRED_DAYS
}

export function checkVacationAdvanceNotice(startDate: string): {
  sufficient: boolean
  daysAhead: number
  message: string
} {
  const today = new Date()
  const start = new Date(startDate)
  const diffMs = start.getTime() - today.getTime()
  const daysAhead = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (daysAhead < VACATION_ADVANCE_DAYS) {
    return {
      sufficient: false,
      daysAhead,
      message: `ต้องยื่นล่วงหน้าอย่างน้อย ${VACATION_ADVANCE_DAYS} วัน (คุณยื่นล่วงหน้า ${daysAhead} วัน)`,
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
  if (days > 10) {
    return {
      allowed: false,
      message: 'ลาพักร้อนต่อเนื่องได้ไม่เกิน 10 วัน/ครั้ง',
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
  if (accumulatedMinutes === 0) {
    return { level: 'ok', label: 'ปกติ', loseGoodBehaviorBonus: false, losePickingFee: false }
  }
  if (accumulatedMinutes <= TARDINESS_BONUS_THRESHOLD) {
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
  const start = new Date(startDate)
  const end = new Date(endDate)
  let count = 0
  const current = new Date(start)
  while (current <= end) {
    const dayOfWeek = current.getDay()
    const dateStr = current.toISOString().split('T')[0]
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = THAI_PUBLIC_HOLIDAYS_2026.includes(dateStr)
    if (!isWeekend && !isHoliday) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

export function getCurrentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

import { RequestType, RequestStatus, UserRole } from '../types'

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  change_hours: 'เปลี่ยนแปลงเวลาทำงาน',
  change_day_off: 'เปลี่ยนแปลงวันหยุด',
  personal_leave: 'ลากิจ',
  sick_leave: 'ลาป่วย',
  vacation: 'ลาพักร้อน',
  late: 'มาสาย',
}

export const REQUEST_TYPE_ICONS: Record<RequestType, string> = {
  change_hours: '🕐',
  change_day_off: '📅',
  personal_leave: '📝',
  sick_leave: '🏥',
  vacation: '🌴',
  late: '⏰',
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending_pharmacist: 'รอเภสัชอนุมัติ',
  pending_manager: 'รอ Area Manager อนุมัติ',
  pending_director: 'รอผอ.อนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
}

export const STATUS_COLORS: Record<RequestStatus, string> = {
  pending_pharmacist: 'bg-yellow-100 text-yellow-800',
  pending_manager: 'bg-blue-100 text-blue-800',
  pending_director: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  employee: 'พนักงาน',
  pharmacist: 'เภสัชกร',
  area_manager: 'Area Manager',
  director: 'ผู้อำนวยการ',
  admin: 'ผู้ดูแลระบบ',
}

// Combined counter limits
export const COMBINED_COUNTER_MONTH_LIMIT = 2
export const COMBINED_COUNTER_YEAR_LIMIT = 12

// Tardiness thresholds (minutes)
export const TARDINESS_BONUS_THRESHOLD = 30

// Vacation advance notice (days)
export const VACATION_ADVANCE_DAYS = 30

// Sick leave cert threshold (days)
export const SICK_CERT_REQUIRED_DAYS = 3

// Leave quotas (defaults)
export const DEFAULT_SICK_DAYS = 30
export const DEFAULT_PERSONAL_DAYS = 3
export const DEFAULT_VACATION_DAYS = 0
export const DEFAULT_WEEKLY_OFF_MAX = 10

// Thai public holidays 2026
export const THAI_PUBLIC_HOLIDAYS_2026: string[] = [
  '2026-01-01', // วันขึ้นปีใหม่
  '2026-02-03', // ชดเชยวันตรุษจีน
  '2026-02-28', // วันมาฆบูชา
  '2026-04-06', // วันจักรี
  '2026-04-13', // วันสงกรานต์
  '2026-04-14', // วันสงกรานต์
  '2026-04-15', // วันสงกรานต์
  '2026-05-01', // วันแรงงานแห่งชาติ
  '2026-05-11', // วันวิสาขบูชา
  '2026-06-03', // วันเฉลิมพระชนมพรรษาสมเด็จพระราชินี
  '2026-07-28', // วันเฉลิมพระชนมพรรษา ร.10
  '2026-08-12', // วันแม่แห่งชาติ
  '2026-10-13', // วันนวมินทรมหาราช
  '2026-10-23', // วันปิยมหาราช
  '2026-12-05', // วันพ่อแห่งชาติ
  '2026-12-10', // วันรัฐธรรมนูญ
  '2026-12-31', // วันสิ้นปี
]

export const DEPARTMENTS = [
  'สำนักงาน',
  'คลังสินค้า',
  'จัดส่ง',
  'ร้านยาสาขา',
  'บัญชี/การเงิน',
  'ฝ่ายขาย',
  'อื่นๆ',
]

export const DEPARTMENT_SCHEDULES: Record<string, { start: string; end: string }> = {
  'สำนักงาน': { start: '09:00', end: '18:00' },
  'คลังสินค้า': { start: '07:30', end: '16:30' },
  'จัดส่ง': { start: '07:30', end: '16:30' },
  'ร้านยาสาขา': { start: '09:00', end: '21:00' },
  'บัญชี/การเงิน': { start: '09:00', end: '18:00' },
  'ฝ่ายขาย': { start: '09:00', end: '18:00' },
  'อื่นๆ': { start: '09:00', end: '18:00' },
}

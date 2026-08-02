export type UserRole = 'employee' | 'pharmacist' | 'area_manager' | 'director' | 'admin' | 'super_admin'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string
  role: UserRole
  areaId: string
  branchName: string
  employeeCode: string
  department: string
  position: string
  isProfileComplete: boolean
  groupId?: string          // employee group determining which settings apply
  createdAt: Date
  updatedAt: Date
}

export type RequestType =
  | 'change_hours'
  | 'change_day_off'
  | 'personal_leave'
  | 'sick_leave'
  | 'vacation'
  | 'late'

export type RequestStatus =
  | 'pending_pharmacist'
  | 'pending_manager'
  | 'pending_director'
  | 'approved'
  | 'rejected'

export interface ApprovalAction {
  uid: string
  name: string
  action: 'approved' | 'rejected'
  note: string
  timestamp: Date
}

export interface RequestDetails {
  // change_hours
  date?: string
  originalStart?: string
  originalEnd?: string
  newStart?: string
  newEnd?: string
  // change_day_off
  originalDayOff?: string
  newDayOff?: string
  // personal / sick
  leaveType?: 'personal' | 'sick'
  startDate?: string
  endDate?: string
  days?: number
  attachmentUrl?: string
  // late
  scheduledStart?: string
  actualArrival?: string
  // shared
  reason: string
}

export interface LeaveRequest {
  requestId: string
  type: RequestType
  submittedBy: string
  submitterName: string
  submitterEmail: string
  areaId: string
  status: RequestStatus
  chain?: ApprovalStage[]        // resolved approval chain for this request (ends at director)
  createdAt: Date
  updatedAt: Date
  details: RequestDetails
  pharmacistApproval?: ApprovalAction
  managerApproval?: ApprovalAction
  directorApproval?: ApprovalAction
}

export interface LeaveQuota {
  uid: string
  year: number
  personal_total: number
  personal_used: number
  sick_total: number
  sick_used: number
  vacation_total: number
  vacation_used: number
  weekly_off_accumulated: number
}

export interface AttendanceStats {
  uid: string
  year: number
  absences: number
  tardiness_minutes: number
  leaves_taken: number
  combined_counter_month: number
  combined_counter_year: number
  combined_counter_month_key: string
}

export interface Branch {
  id: string
  name: string
  managerId?: string
  pharmacistId?: string
}

// Numeric business-rule settings — configurable per employee group.
export interface GroupSettings {
  // Combined counter (เปลี่ยนวันหยุด + มาสาย + ออกก่อนเวลา)
  combinedCounterMonthLimit: number
  combinedCounterYearLimit: number
  // เกณฑ์มาสาย (นาที/เดือน)
  tardinessBonusThreshold: number
  // ลาพักร้อน
  vacationAdvanceDays: number      // ต้องยื่นล่วงหน้ากี่วัน
  vacationMaxConsecutive: number   // ลาต่อเนื่องได้สูงสุดกี่วัน/ครั้ง
  // ลาป่วย
  sickCertRequiredDays: number     // ป่วยกี่วันขึ้นไปต้องมีใบรับรองแพทย์
  // โควต้าเริ่มต้น (ตอนพนักงานสมัครใหม่)
  defaultSickDays: number
  defaultPersonalDays: number
  defaultVacationDays: number
  defaultWeeklyOffMax: number
}

// Org-wide settings: the default rule values + shared holiday calendar.
export interface SystemSettings extends GroupSettings {
  // วันหยุดประเพณี (YYYY-MM-DD) — shared across all groups
  holidays: string[]
  updatedAt?: Date
  updatedByName?: string
}

// An employee group with its own rule values. Holidays come from SystemSettings.
export interface EmployeeGroup extends GroupSettings {
  id: string
  name: string
  createdAt?: Date
  updatedAt?: Date
}

// Approval routing — depends on WHO submits the request.
// Every resolved chain ends at 'director' (ผอ. อนุมัติทุกคน).
export type ApprovalStage = 'pharmacist' | 'manager' | 'director'
export type FlowSlot = ApprovalStage | 'bypass'   // 'bypass' = box นี้ไม่ต้องอนุมัติ

export interface RoleApprovalFlow {
  slots: FlowSlot[]             // 3 boxes; each picks an approver or bypass
}

export interface ApprovalFlowConfig {
  employee: RoleApprovalFlow
  pharmacist: RoleApprovalFlow
  area_manager: RoleApprovalFlow
  updatedAt?: Date
  updatedByName?: string
}

export type AuditAction =
  | 'role_change'
  | 'quota_update'
  | 'send_notification'
  | 'request_approved'
  | 'request_rejected'
  | 'settings_update'
  | 'group_update'
  | 'group_assign'

export interface AuditLog {
  logId: string
  action: AuditAction
  actorUid: string
  actorName: string
  actorRole: UserRole
  targetUid?: string
  targetName?: string
  details: Record<string, unknown>
  createdAt: Date
}

import { AttendanceStats } from '../../types'
import { COMBINED_COUNTER_MONTH_LIMIT, COMBINED_COUNTER_YEAR_LIMIT } from '../../utils/constants'
import { getCurrentMonthKey } from '../../utils/businessRules'

interface Props {
  stats: AttendanceStats
}

export default function CombinedCounter({ stats }: Props) {
  const currentKey = getCurrentMonthKey()
  const monthCount = stats.combined_counter_month_key === currentKey ? stats.combined_counter_month : 0
  const yearCount = stats.combined_counter_year ?? 0

  const monthPct = (monthCount / COMBINED_COUNTER_MONTH_LIMIT) * 100
  const yearPct = (yearCount / COMBINED_COUNTER_YEAR_LIMIT) * 100

  const monthColor = monthPct >= 100 ? 'bg-red-500' : monthPct >= 50 ? 'bg-yellow-400' : 'bg-green-500'
  const yearColor = yearPct >= 100 ? 'bg-red-500' : yearPct >= 75 ? 'bg-yellow-400' : 'bg-green-500'

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⚠️</span>
        <h3 className="text-sm font-semibold text-gray-700">การเปลี่ยนวันหยุด / มาสาย</h3>
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>เดือนนี้</span>
            <span className={monthCount >= COMBINED_COUNTER_MONTH_LIMIT ? 'text-red-600 font-bold' : ''}>
              {monthCount} / {COMBINED_COUNTER_MONTH_LIMIT} ครั้ง
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className={`${monthColor} h-2 rounded-full transition-all`} style={{ width: `${Math.min(monthPct, 100)}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>ปีนี้</span>
            <span className={yearCount >= COMBINED_COUNTER_YEAR_LIMIT ? 'text-red-600 font-bold' : ''}>
              {yearCount} / {COMBINED_COUNTER_YEAR_LIMIT} ครั้ง
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className={`${yearColor} h-2 rounded-full transition-all`} style={{ width: `${Math.min(yearPct, 100)}%` }} />
          </div>
        </div>
      </div>
      {(monthCount >= COMBINED_COUNTER_MONTH_LIMIT || yearCount >= COMBINED_COUNTER_YEAR_LIMIT) && (
        <p className="text-xs text-red-600 mt-3 font-medium">
          ⛔ ถึงขีดจำกัดแล้ว — ไม่สามารถยื่นคำขอประเภทนี้ได้
        </p>
      )}
    </div>
  )
}

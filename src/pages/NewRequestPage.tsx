import { useNavigate } from 'react-router-dom'
import { REQUEST_TYPE_LABELS, REQUEST_TYPE_ICONS } from '../utils/constants'
import { RequestType } from '../types'

const types: { type: RequestType; path: string; desc: string }[] = [
  { type: 'change_hours', path: '/requests/new/change-hours', desc: 'ขอเปลี่ยนเวลาเข้า-ออกงาน' },
  { type: 'change_day_off', path: '/requests/new/change-day-off', desc: 'ขอสลับวันหยุดประจำสัปดาห์' },
  { type: 'personal_leave', path: '/requests/new/personal-sick', desc: 'ใช้วันลากิจหรือลาป่วย' },
  { type: 'vacation', path: '/requests/new/vacation', desc: 'ใช้วันลาพักร้อน' },
  { type: 'late', path: '/requests/new/late', desc: 'แจ้งการมาทำงานสาย' },
]

export default function NewRequestPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">ยื่นคำขอ</h1>
        <p className="text-sm text-gray-500 mt-1">เลือกประเภทคำขอที่ต้องการ</p>
      </div>

      <div className="space-y-3">
        {types.map(({ type, path, desc }) => (
          <button
            key={type}
            onClick={() => navigate(path)}
            className="w-full bg-white border border-gray-200 hover:border-green-400 hover:shadow-md rounded-2xl p-5 text-left flex items-center gap-4 transition-all"
          >
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              {REQUEST_TYPE_ICONS[type]}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{REQUEST_TYPE_LABELS[type]}</p>
              <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
            </div>
            <span className="ml-auto text-gray-300 text-lg">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

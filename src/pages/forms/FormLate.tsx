import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createRequest } from '../../services/requestService'
import { useAuth } from '../../hooks/useAuth'
import { useQuotas } from '../../hooks/useQuotas'
import { checkCombinedCounterMonth, checkCombinedCounterYear } from '../../utils/businessRules'
import { getTodayString } from '../../utils/dateUtils'

const schema = z.object({
  date: z.string().min(1, 'กรุณาเลือกวันที่'),
  scheduledStart: z.string().min(1, 'กรุณากรอกเวลาเข้างานที่กำหนด'),
  actualArrival: z.string().min(1, 'กรุณากรอกเวลาที่มาถึงจริง'),
  reason: z.string().min(5, 'กรุณากรอกเหตุผลอย่างน้อย 5 ตัวอักษร'),
})
type FormData = z.infer<typeof schema>

export default function FormLate() {
  const { profile } = useAuth()
  const { stats } = useQuotas()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: getTodayString() },
  })

  const monthCheck = stats ? checkCombinedCounterMonth(stats) : null
  const yearCheck = stats ? checkCombinedCounterYear(stats) : null
  const isBlocked = !!(monthCheck && !monthCheck.allowed) || !!(yearCheck && !yearCheck.allowed)

  async function onSubmit(data: FormData) {
    if (!profile || isBlocked) return
    setSubmitting(true)
    setError('')
    try {
      const id = await createRequest(profile, 'late', data)
      navigate(`/requests/${id}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg === 'COMBINED_MONTH_LIMIT') setError('ถึงขีดจำกัด 2 ครั้ง/เดือนแล้ว')
      else if (msg === 'COMBINED_YEAR_LIMIT') setError('ถึงขีดจำกัด 12 ครั้ง/ปีแล้ว')
      else setError('ยื่นคำขอไม่สำเร็จ กรุณาลองใหม่')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        ← ย้อนกลับ
      </button>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⏰</span>
          <h1 className="text-lg font-bold text-gray-800">มาสาย</h1>
        </div>

        <div className="bg-blue-50 text-blue-700 rounded-xl px-4 py-3 text-sm mb-4">
          ℹ️ กรุณาโทรแจ้งเภสัชก่อน แล้วยื่นแบบฟอร์มนี้เมื่อมาถึง
        </div>

        {monthCheck?.warn && (
          <div className="bg-yellow-50 text-yellow-800 rounded-xl px-4 py-3 text-sm mb-4">
            ⚠️ {monthCheck.message}
          </div>
        )}
        {isBlocked && (
          <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            ⛔ {monthCheck?.message || yearCheck?.message}
          </div>
        )}
        {error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">วันที่มาสาย <span className="text-red-500">*</span></label>
            <input type="date" {...register('date')} max={getTodayString()} className="input" />
            {errors.date && <p className="err">{errors.date.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">เวลาที่กำหนดเข้างาน <span className="text-red-500">*</span></label>
              <input type="time" {...register('scheduledStart')} className="input" />
              {errors.scheduledStart && <p className="err">{errors.scheduledStart.message}</p>}
            </div>
            <div>
              <label className="label">เวลาที่มาถึงจริง <span className="text-red-500">*</span></label>
              <input type="time" {...register('actualArrival')} className="input" />
              {errors.actualArrival && <p className="err">{errors.actualArrival.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">เหตุผล <span className="text-red-500">*</span></label>
            <textarea {...register('reason')} rows={3} className="input" placeholder="ระบุเหตุผล..." />
            {errors.reason && <p className="err">{errors.reason.message}</p>}
          </div>
          <button type="submit" disabled={submitting || isBlocked} className="btn-primary w-full">
            {submitting ? 'กำลังยื่น...' : 'ยื่นคำขอ'}
          </button>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createRequest } from '../../services/requestService'
import { useAuth } from '../../hooks/useAuth'
import { useQuotas } from '../../hooks/useQuotas'
import { checkCombinedCounterMonth, checkCombinedCounterYear } from '../../utils/businessRules'
import { parseRequestError } from '../../utils/errorUtils'

const schema = z.object({
  originalDayOff: z.string().min(1, 'กรุณาเลือกวันหยุดเดิม'),
  newDayOff: z.string().min(1, 'กรุณาเลือกวันหยุดใหม่'),
  reason: z.string().min(5, 'กรุณากรอกเหตุผลอย่างน้อย 5 ตัวอักษร'),
})
type FormData = z.infer<typeof schema>

export default function FormChangeDayOff() {
  const { profile } = useAuth()
  const { stats } = useQuotas()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const monthCheck = stats ? checkCombinedCounterMonth(stats) : null
  const yearCheck = stats ? checkCombinedCounterYear(stats) : null
  const isBlocked = !!(monthCheck && !monthCheck.allowed) || !!(yearCheck && !yearCheck.allowed)

  async function onSubmit(data: FormData) {
    if (!profile || isBlocked) return
    setSubmitting(true)
    setError('')
    try {
      const id = await createRequest(profile, 'change_day_off', data)
      navigate(`/requests/${id}`)
    } catch (e) {
      setError(parseRequestError(e))
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
          <span className="text-2xl">📅</span>
          <h1 className="text-lg font-bold text-gray-800">เปลี่ยนแปลงวันหยุด</h1>
        </div>

        {(monthCheck?.warn) && (
          <div className="bg-yellow-50 text-yellow-800 rounded-xl px-4 py-3 text-sm mb-4">
            ⚠️ {monthCheck.message}
          </div>
        )}
        {(isBlocked) && (
          <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            ⛔ {monthCheck?.message || yearCheck?.message}
          </div>
        )}
        {error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">วันหยุดเดิม <span className="text-red-500">*</span></label>
            <input type="date" {...register('originalDayOff')} className="input" />
            {errors.originalDayOff && <p className="err">{errors.originalDayOff.message}</p>}
          </div>
          <div>
            <label className="label">วันหยุดใหม่ที่ต้องการ <span className="text-red-500">*</span></label>
            <input type="date" {...register('newDayOff')} className="input" />
            {errors.newDayOff && <p className="err">{errors.newDayOff.message}</p>}
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

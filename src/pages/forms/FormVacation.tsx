import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createRequest } from '../../services/requestService'
import { useAuth } from '../../hooks/useAuth'
import { useQuotas } from '../../hooks/useQuotas'
import { parseRequestError } from '../../utils/errorUtils'
import { countBusinessDays, checkVacationAdvanceNotice, checkVacationMonthLimit } from '../../utils/businessRules'
import { getMinVacationDate } from '../../utils/dateUtils'

const schema = z.object({
  startDate: z.string().min(1, 'กรุณาเลือกวันเริ่มต้น'),
  endDate: z.string().min(1, 'กรุณาเลือกวันสิ้นสุด'),
  reason: z.string().min(5, 'กรุณากรอกเหตุผล'),
})
type FormData = z.infer<typeof schema>

export default function FormVacation() {
  const { profile } = useAuth()
  const { quota } = useQuotas()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const startDate = useWatch({ control, name: 'startDate' })
  const endDate = useWatch({ control, name: 'endDate' })

  const days = startDate && endDate ? countBusinessDays(startDate, endDate) : 0
  const advanceCheck = startDate ? checkVacationAdvanceNotice(startDate) : null
  const monthLimitCheck = days > 0 ? checkVacationMonthLimit(days) : null
  const remaining = quota ? quota.vacation_total - quota.vacation_used : 0
  const overQuota = days > remaining

  async function onSubmit(data: FormData) {
    if (!profile) return
    setSubmitting(true)
    setError('')
    try {
      const id = await createRequest(profile, 'vacation', { ...data, days })
      navigate(`/requests/${id}`)
    } catch (e) {
      setError(parseRequestError(e))
      setSubmitting(false)
    }
  }

  const minDate = getMinVacationDate()

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        ← ย้อนกลับ
      </button>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🌴</span>
          <h1 className="text-lg font-bold text-gray-800">ลาพักร้อน</h1>
        </div>

        <div className="bg-blue-50 text-blue-700 rounded-xl px-4 py-3 text-sm mb-4">
          ℹ️ ต้องยื่นล่วงหน้าอย่างน้อย 30 วัน · ลาต่อเนื่องได้ไม่เกิน 10 วัน/ครั้ง
        </div>

        {error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

        {advanceCheck && !advanceCheck.sufficient && (
          <div className="bg-yellow-50 text-yellow-800 rounded-xl px-4 py-3 text-sm mb-4">
            ⚠️ {advanceCheck.message}
          </div>
        )}
        {monthLimitCheck && !monthLimitCheck.allowed && (
          <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            ⛔ {monthLimitCheck.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">วันเริ่ม <span className="text-red-500">*</span></label>
              <input type="date" {...register('startDate')} min={minDate} className="input" />
              {errors.startDate && <p className="err">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="label">วันสิ้นสุด <span className="text-red-500">*</span></label>
              <input type="date" {...register('endDate')} min={startDate || minDate} className="input" />
              {errors.endDate && <p className="err">{errors.endDate.message}</p>}
            </div>
          </div>

          {days > 0 && (
            <div className={`rounded-xl px-4 py-3 text-sm ${overQuota ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {overQuota
                ? `⚠️ ขอ ${days} วัน แต่เหลือสิทธิ์ ${remaining} วัน`
                : `✓ รวม ${days} วันทำการ (เหลือสิทธิ์ ${remaining} วัน)`}
            </div>
          )}

          <div>
            <label className="label">เหตุผล <span className="text-red-500">*</span></label>
            <textarea {...register('reason')} rows={3} className="input" placeholder="ระบุเหตุผล..." />
            {errors.reason && <p className="err">{errors.reason.message}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting || !!(monthLimitCheck && !monthLimitCheck.allowed)}
            className="btn-primary w-full"
          >
            {submitting ? 'กำลังยื่น...' : 'ยื่นคำขอ'}
          </button>
        </form>
      </div>
    </div>
  )
}

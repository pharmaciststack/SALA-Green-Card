import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createRequest } from '../../services/requestService'
import { useAuth } from '../../hooks/useAuth'

const schema = z.object({
  date: z.string().min(1, 'กรุณาเลือกวันที่'),
  originalStart: z.string().min(1, 'กรุณากรอกเวลาเดิม'),
  originalEnd: z.string().min(1, 'กรุณากรอกเวลาเดิม'),
  newStart: z.string().min(1, 'กรุณากรอกเวลาใหม่'),
  newEnd: z.string().min(1, 'กรุณากรอกเวลาใหม่'),
  reason: z.string().min(5, 'กรุณากรอกเหตุผลอย่างน้อย 5 ตัวอักษร'),
})
type FormData = z.infer<typeof schema>

export default function FormChangeHours() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    if (!profile) return
    setSubmitting(true)
    setError('')
    try {
      const id = await createRequest(profile, 'change_hours', data)
      navigate(`/requests/${id}`)
    } catch {
      setError('ยื่นคำขอไม่สำเร็จ กรุณาลองใหม่')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        ← ย้อนกลับ
      </button>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🕐</span>
          <h1 className="text-lg font-bold text-gray-800">เปลี่ยนแปลงเวลาทำงาน</h1>
        </div>
        {error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">วันที่ <span className="text-red-500">*</span></label>
            <input type="date" {...register('date')} className="input" />
            {errors.date && <p className="err">{errors.date.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">เวลาเข้างานเดิม <span className="text-red-500">*</span></label>
              <input type="time" {...register('originalStart')} className="input" />
              {errors.originalStart && <p className="err">{errors.originalStart.message}</p>}
            </div>
            <div>
              <label className="label">เวลาออกงานเดิม <span className="text-red-500">*</span></label>
              <input type="time" {...register('originalEnd')} className="input" />
              {errors.originalEnd && <p className="err">{errors.originalEnd.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">เวลาเข้างานใหม่ <span className="text-red-500">*</span></label>
              <input type="time" {...register('newStart')} className="input" />
              {errors.newStart && <p className="err">{errors.newStart.message}</p>}
            </div>
            <div>
              <label className="label">เวลาออกงานใหม่ <span className="text-red-500">*</span></label>
              <input type="time" {...register('newEnd')} className="input" />
              {errors.newEnd && <p className="err">{errors.newEnd.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">เหตุผล <span className="text-red-500">*</span></label>
            <textarea {...register('reason')} rows={3} className="input" placeholder="ระบุเหตุผล..." />
            {errors.reason && <p className="err">{errors.reason.message}</p>}
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'กำลังยื่น...' : 'ยื่นคำขอ'}
          </button>
        </form>
      </div>
    </div>
  )
}

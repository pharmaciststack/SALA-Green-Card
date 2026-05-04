import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createRequest } from '../../services/requestService'
import { uploadDoctorCert } from '../../services/storageService'
import { useAuth } from '../../hooks/useAuth'
import { useQuotas } from '../../hooks/useQuotas'
import { countBusinessDays, requiresDoctorCert } from '../../utils/businessRules'
import { getTodayString } from '../../utils/dateUtils'

const schema = z.object({
  leaveType: z.enum(['personal', 'sick']),
  startDate: z.string().min(1, 'กรุณาเลือกวันเริ่มต้น'),
  endDate: z.string().min(1, 'กรุณาเลือกวันสิ้นสุด'),
  reason: z.string().min(5, 'กรุณากรอกเหตุผลอย่างน้อย 5 ตัวอักษร'),
})
type FormData = z.infer<typeof schema>

export default function FormPersonalSick() {
  const { profile } = useAuth()
  const { quota } = useQuotas()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [certFile, setCertFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { leaveType: 'personal' },
  })
  const leaveType = useWatch({ control, name: 'leaveType' })
  const startDate = useWatch({ control, name: 'startDate' })
  const endDate = useWatch({ control, name: 'endDate' })

  const days = startDate && endDate ? countBusinessDays(startDate, endDate) : 0
  const needsCert = leaveType === 'sick' && requiresDoctorCert(days)
  const remaining = leaveType === 'personal'
    ? (quota ? quota.personal_total - quota.personal_used : 0)
    : (quota ? quota.sick_total - quota.sick_used : 0)
  const overQuota = days > remaining && remaining >= 0

  async function onSubmit(data: FormData) {
    if (!profile) return
    if (needsCert && !certFile) { setError('กรุณาแนบใบรับรองแพทย์ (ป่วยตั้งแต่ 3 วันขึ้นไป)'); return }
    setSubmitting(true)
    setError('')
    try {
      const tempId = `temp_${Date.now()}`
      let attachmentUrl = ''
      if (certFile) {
        attachmentUrl = await uploadDoctorCert(profile.uid, tempId, certFile)
      }
      const id = await createRequest(profile, data.leaveType === 'personal' ? 'personal_leave' : 'sick_leave', {
        ...data,
        days,
        attachmentUrl,
      })
      navigate(`/requests/${id}`)
    } catch {
      setError('ยื่นคำขอไม่สำเร็จ กรุณาลองใหม่')
      setSubmitting(false)
    }
  }

  const today = getTodayString()

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        ← ย้อนกลับ
      </button>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📝</span>
          <h1 className="text-lg font-bold text-gray-800">ลากิจ / ลาป่วย</h1>
        </div>
        {error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Leave type toggle */}
          <div>
            <label className="label">ประเภทการลา</label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {(['personal', 'sick'] as const).map((type) => (
                <label key={type} className="flex-1 cursor-pointer">
                  <input type="radio" {...register('leaveType')} value={type} className="sr-only" />
                  <div className={`py-2.5 text-center text-sm font-medium transition-colors ${leaveType === type ? 'bg-green-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                    {type === 'personal' ? '📝 ลากิจ' : '🏥 ลาป่วย'}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">วันเริ่ม <span className="text-red-500">*</span></label>
              <input type="date" {...register('startDate')} min={today} className="input" />
              {errors.startDate && <p className="err">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="label">วันสิ้นสุด <span className="text-red-500">*</span></label>
              <input type="date" {...register('endDate')} min={startDate || today} className="input" />
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

          {/* Doctor cert upload */}
          {needsCert && (
            <div>
              <label className="label">
                ใบรับรองแพทย์ <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 ml-1">(ป่วย ≥ 3 วัน)</span>
              </label>
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setCertFile(e.target.files?.[0] ?? null)} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 hover:border-green-400 rounded-xl py-4 text-sm text-gray-500 hover:text-green-600 transition-colors"
              >
                {certFile ? `✓ ${certFile.name}` : '📎 แนบไฟล์ (รูปภาพ / PDF)'}
              </button>
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'กำลังยื่น...' : 'ยื่นคำขอ'}
          </button>
        </form>
      </div>
    </div>
  )
}

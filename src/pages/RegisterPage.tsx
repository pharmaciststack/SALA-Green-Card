import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { completeRegistration, getUserProfile } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { useAuth } from '../hooks/useAuth'
import { DEPARTMENTS, POSITIONS, BRANCHES } from '../utils/constants'

const schema = z.object({
  displayName: z.string().min(2, 'กรุณากรอกชื่อ-นามสกุล'),
  branchName: z.string().min(2, 'กรุณากรอกชื่อสาขา'),
  department: z.string().min(1, 'กรุณาเลือกแผนก'),
  position: z.string().min(1, 'กรุณาเลือกตำแหน่ง'),
  employeeCode: z.string().min(1, 'กรุณากรอกรหัสพนักงาน'),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { firebaseUser, setProfile } = useAuthStore()
  const { isProfileComplete } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isProfileComplete) {
      navigate('/dashboard', { replace: true })
    }
  }, [isProfileComplete, navigate])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: firebaseUser?.displayName ?? '',
    },
  })

  async function onSubmit(data: FormData) {
    if (!firebaseUser) return
    setSaving(true)
    setError('')
    try {
      await completeRegistration(
        firebaseUser.uid,
        firebaseUser.email ?? '',
        firebaseUser.photoURL ?? '',
        data.displayName,
        data.branchName,
        data.department,
        data.employeeCode,
        data.position
      )
      const profile = await getUserProfile(firebaseUser.uid)
      setProfile(profile)
    } catch {
      setError('บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👤</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">ลงทะเบียนพนักงาน</h1>
          <p className="text-gray-500 text-sm mt-1">
            เข้าสู่ระบบด้วย: <span className="font-medium text-gray-700">{firebaseUser?.email}</span>
          </p>
          <p className="text-gray-400 text-xs mt-1">กรุณากรอกข้อมูลก่อนใช้งานระบบ</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              {...register('displayName')}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              placeholder="เช่น สมชาย ใจดี"
            />
            {errors.displayName && (
              <p className="text-red-500 text-xs mt-1">{errors.displayName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รหัสพนักงาน <span className="text-red-500">*</span>
            </label>
            <input
              {...register('employeeCode')}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              placeholder="เช่น EMP001"
            />
            {errors.employeeCode && (
              <p className="text-red-500 text-xs mt-1">{errors.employeeCode.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              สาขา <span className="text-red-500">*</span>
            </label>
            <select
              {...register('branchName')}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-white"
            >
              <option value="">-- เลือกสาขา --</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {errors.branchName && (
              <p className="text-red-500 text-xs mt-1">{errors.branchName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ตำแหน่ง <span className="text-red-500">*</span>
            </label>
            <select
              {...register('position')}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-white"
            >
              <option value="">-- เลือกตำแหน่ง --</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {errors.position && (
              <p className="text-red-500 text-xs mt-1">{errors.position.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              แผนก <span className="text-red-500">*</span>
            </label>
            <select
              {...register('department')}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-white"
            >
              <option value="">-- เลือกแผนก --</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {errors.department && (
              <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {saving ? 'กำลังบันทึก...' : 'ยืนยันและเข้าใช้งาน'}
          </button>
        </form>
      </div>
    </div>
  )
}

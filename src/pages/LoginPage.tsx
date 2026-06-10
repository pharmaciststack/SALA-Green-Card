import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '../services/authService'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { isAuthenticated, isProfileComplete } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isProfileComplete ? '/dashboard' : '/register', { replace: true })
    }
  }, [isAuthenticated, isProfileComplete, navigate])

  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // user closed popup, just reset
      } else if (code === 'auth/operation-not-allowed') {
        setError('Google Sign-In ยังไม่ได้เปิดใช้งาน กรุณาแจ้ง Admin')
      } else if (code === 'auth/popup-blocked') {
        setError('Popup ถูก block กรุณาอนุญาต popup สำหรับหน้านี้แล้วลองใหม่')
      } else {
        setError(`เข้าสู่ระบบไม่สำเร็จ (${code || 'unknown'}) กรุณาลองใหม่อีกครั้ง`)
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.1)] w-full max-w-md text-center overflow-hidden">
        <div
          className="px-6 py-5 text-white"
          style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
        >
          <img
            src="https://img1.pic.in.th/images/logo--1.png"
            alt="ศาลาโอสถ"
            className="w-14 h-14 mx-auto mb-2 bg-white rounded-xl p-1.5 object-contain"
          />
          <h1 className="text-xl font-bold">ระบบลาและบันทึกเวลาทำงาน</h1>
          <p className="text-xs opacity-80 mt-1">บริษัท ศาลาโอสถรีเทล จำกัด</p>
        </div>
        <div className="p-8">
        <div className="mb-6">
          <p className="text-gray-500 text-sm">เข้าสู่ระบบด้วยบัญชี Gmail ขององค์กร</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
        </button>

        <p className="text-xs text-gray-400 mt-6">
          ใช้ได้เฉพาะบัญชีที่ได้รับอนุญาตจากองค์กรเท่านั้น
        </p>
        </div>
      </div>
    </div>
  )
}

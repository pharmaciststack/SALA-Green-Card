import { useEffect, useState } from 'react'
import { listenQuota, listenStats } from '../services/quotaService'
import { LeaveQuota, AttendanceStats } from '../types'
import { useAuth } from './useAuth'

export function useQuotas() {
  const { profile } = useAuth()
  const [quota, setQuota] = useState<LeaveQuota | null>(null)
  const [stats, setStats] = useState<AttendanceStats | null>(null)

  useEffect(() => {
    if (!profile) return
    const year = new Date().getFullYear()
    const unsub1 = listenQuota(profile.uid, year, setQuota)
    const unsub2 = listenStats(profile.uid, year, setStats)
    return () => { unsub1(); unsub2() }
  }, [profile])

  return { quota, stats }
}

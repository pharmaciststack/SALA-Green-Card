import { useEffect, useState } from 'react'
import { UserProfile } from '../../types'
import { getAllUsers } from '../../services/userService'
import { sendMailNotification } from '../../services/mailService'
import { useAuth } from '../../hooks/useAuth'
import { BRANCHES, POSITIONS } from '../../utils/constants'

export default function AdminNotificationPage() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filtered, setFiltered] = useState<UserProfile[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // filters
  const [search, setSearch] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [filterPosition, setFilterPosition] = useState('')

  // compose
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllUsers().then((u) => { setUsers(u); setLoading(false) })
  }, [])

  useEffect(() => {
    let result = users
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) => u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      )
    }
    if (filterBranch) result = result.filter((u) => u.branchName === filterBranch)
    if (filterPosition) result = result.filter((u) => u.position === filterPosition)
    setFiltered(result)
  }, [users, search, filterBranch, filterPosition])

  function toggleUser(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(uid) ? next.delete(uid) : next.add(uid)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(filtered.map((u) => u.uid)))
  }

  function clearAll() {
    setSelected(new Set())
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) { setError('กรุณากรอกหัวข้อและเนื้อหา'); return }
    if (selected.size === 0) { setError('กรุณาเลือกผู้รับอย่างน้อย 1 คน'); return }

    setSending(true)
    setError('')
    try {
      const emails = users
        .filter((u) => selected.has(u.uid) && u.email)
        .map((u) => u.email)

      await sendMailNotification({ to: emails, subject, body }, profile ?? undefined)
      setSent(true)
      setSubject('')
      setBody('')
      setSelected(new Set())
      setTimeout(() => setSent(false), 4000)
    } catch (e) {
      setError('ส่งไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-800">📧 ส่งอีเมลแจ้งเตือน</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: User selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm">เลือกผู้รับ</h2>

          {/* Filters */}
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรืออีเมล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <div className="flex gap-2">
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
            >
              <option value="">ทุกสาขา</option>
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
            >
              <option value="">ทุกตำแหน่ง</option>
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Select / Clear all */}
          <div className="flex items-center gap-3 text-xs">
            <button onClick={selectAll} className="text-green-600 hover:underline">เลือกทั้งหมด</button>
            <span className="text-gray-300">|</span>
            <button onClick={clearAll} className="text-gray-500 hover:underline">ล้าง</button>
            <span className="text-gray-400 ml-auto">{selected.size} คนที่เลือก</span>
          </div>

          {/* User list */}
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto rounded-xl border border-gray-100">
            {filtered.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">ไม่พบผู้ใช้</p>
            )}
            {filtered.map((u) => (
              <label key={u.uid} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(u.uid)}
                  onChange={() => toggleUser(u.uid)}
                  className="accent-green-500 w-4 h-4"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.displayName || u.email}</p>
                  <p className="text-xs text-gray-400 truncate">{u.branchName} · {u.position || u.email}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Right: Compose */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm">เขียนข้อความ</h2>

          <div>
            <label className="block text-xs text-gray-500 mb-1">หัวข้ออีเมล</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="เช่น แจ้งเตือนการลา / ประกาศสำคัญ"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">เนื้อหา</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="พิมพ์ข้อความที่ต้องการส่งถึงพนักงาน..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            />
          </div>

          <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-500">
            ส่งจาก: <span className="font-medium text-gray-700">{profile?.displayName}</span>
            {' · '}ผู้รับ: <span className="font-medium text-green-600">{selected.size} คน</span>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-3 py-2">{error}</div>
          )}

          {sent && (
            <div className="bg-green-50 text-green-700 text-sm rounded-xl px-3 py-2">✅ ส่งอีเมลสำเร็จแล้ว</div>
          )}

          <button
            onClick={handleSend}
            disabled={sending || selected.size === 0 || !subject || !body}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {sending ? 'กำลังส่ง...' : `📤 ส่งอีเมลไปยัง ${selected.size} คน`}
          </button>
        </div>
      </div>
    </div>
  )
}

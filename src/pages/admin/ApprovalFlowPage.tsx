import { useEffect, useState } from 'react'
import { ApprovalFlowConfig, FlowSlot } from '../../types'
import { getFlow, updateFlow, DEFAULT_FLOW, resolveChain } from '../../services/approvalFlowService'
import { useAuth } from '../../hooks/useAuth'

type SubmitterRole = 'employee' | 'pharmacist' | 'area_manager'

const ROLE_LABEL: Record<SubmitterRole, string> = {
  employee: 'พนักงาน',
  pharmacist: 'เภสัช',
  area_manager: 'Area Manager',
}

const SLOT_OPTIONS: { value: FlowSlot; label: string }[] = [
  { value: 'bypass', label: '— ไม่ต้องอนุมัติ —' },
  { value: 'pharmacist', label: 'เภสัช' },
  { value: 'manager', label: 'Area Manager' },
  { value: 'director', label: 'ผอ.' },
]

const STAGE_LABEL: Record<string, string> = {
  pharmacist: 'เภสัช', manager: 'Area Manager', director: 'ผอ.',
}

const SUBMITTERS: SubmitterRole[] = ['employee', 'pharmacist', 'area_manager']

export default function ApprovalFlowPage() {
  const { profile: actor } = useAuth()
  const [flow, setFlow] = useState<ApprovalFlowConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getFlow().then(setFlow).catch(() => setFlow(DEFAULT_FLOW))
  }, [])

  function setSlot(role: SubmitterRole, boxIdx: number, value: FlowSlot) {
    if (!flow) return
    const slots = [...(flow[role].slots.length === 3 ? flow[role].slots : ['bypass', 'bypass', 'bypass'])] as FlowSlot[]
    slots[boxIdx] = value
    setFlow({ ...flow, [role]: { slots } })
    setSaved(false)
  }

  async function handleSave() {
    if (!flow || !actor) return
    setSaving(true)
    setError('')
    try {
      await updateFlow(flow, actor)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  if (!flow) return <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      <div>
        <h1 className="text-xl font-bold text-gray-800">🔀 ตั้งค่าสายการอนุมัติ</h1>
        <p className="text-sm text-gray-500 mt-0.5">เลือกผู้อนุมัติทีละขั้น (สูงสุด 3 ขั้น) หรือเลือก "ไม่ต้องอนุมัติ" เพื่อข้าม</p>
      </div>

      {SUBMITTERS.map((role, i) => {
        const slots = (flow[role].slots.length === 3 ? flow[role].slots : ['bypass', 'bypass', 'bypass']) as FlowSlot[]
        const chain = resolveChain(slots)
        return (
          <div key={role} className="card">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="font-semibold text-gray-800">{ROLE_LABEL[role]} ยื่นคำขอ</span>
            </div>

            {/* 3 stage boxes */}
            <div className="flex items-end gap-2 flex-wrap">
              {[0, 1, 2].map((boxIdx) => (
                <div key={boxIdx} className="flex flex-col gap-1">
                  <span className="text-[11px] text-gray-400 pl-1">ขั้นที่ {boxIdx + 1}</span>
                  <select
                    value={slots[boxIdx] ?? 'bypass'}
                    onChange={(e) => setSlot(role, boxIdx, e.target.value as FlowSlot)}
                    className="input min-w-[132px]"
                  >
                    {SLOT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Resolved preview */}
            <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              สายจริง: <span className="font-medium text-green-700">
                {chain.map((s) => STAGE_LABEL[s]).join(' → ')}
              </span>
              <span className="text-gray-400"> (ผอ. เป็นผู้อนุมัติสุดท้ายเสมอ)</span>
            </div>
          </div>
        )
      })}

      {/* Director note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-700">
          👑 <span className="font-semibold">ผอ.</span> เป็นผู้อนุมัติสูงสุดของทุกคน — ทุกสายจบที่ ผอ. เสมอ
          (ถึงเลือก "ไม่ต้องอนุมัติ" ทุกช่อง ก็ยังต้องผ่าน ผอ.) และ ผอ. ยื่นคำขอเองไม่ต้องขออนุมัติ
        </p>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-white border-t border-gray-200 px-4 py-3 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="text-sm">
            {error && <span className="text-red-600">{error}</span>}
            {saved && <span className="text-green-600">✅ บันทึกแล้ว</span>}
            {flow.updatedByName && !saved && !error && (
              <span className="text-gray-400 text-xs">แก้ไขล่าสุดโดย {flow.updatedByName}</span>
            )}
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-8">
            {saving ? 'กำลังบันทึก...' : '💾 บันทึกสายอนุมัติ'}
          </button>
        </div>
      </div>
    </div>
  )
}

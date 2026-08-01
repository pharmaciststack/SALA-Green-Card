import { useEffect, useState } from 'react'
import { SystemSettings, EmployeeGroup, GroupSettings } from '../../types'
import { getSettings, updateSettings, DEFAULT_SETTINGS } from '../../services/settingsService'
import { listGroups, createGroup, updateGroup, deleteGroup } from '../../services/groupService'
import { useAuth } from '../../hooks/useAuth'

interface NumField {
  key: keyof GroupSettings
  label: string
  hint?: string
  unit: string
  min?: number
}

const SECTIONS: { title: string; icon: string; fields: NumField[] }[] = [
  {
    title: 'โควต้าวันลาเริ่มต้น (พนักงานใหม่)',
    icon: '📊',
    fields: [
      { key: 'defaultSickDays', label: 'ลาป่วย', unit: 'วัน/ปี' },
      { key: 'defaultPersonalDays', label: 'ลากิจ', unit: 'วัน/ปี' },
      { key: 'defaultVacationDays', label: 'ลาพักร้อน', unit: 'วัน/ปี', hint: 'ปกติเริ่ม 0 แล้วสะสมตามอายุงาน' },
      { key: 'defaultWeeklyOffMax', label: 'หยุดสะสมสูงสุด', unit: 'วัน' },
    ],
  },
  {
    title: 'เปลี่ยนวันหยุด / มาสาย / ออกก่อนเวลา (Combined Counter)',
    icon: '🔄',
    fields: [
      { key: 'combinedCounterMonthLimit', label: 'จำกัดต่อเดือน', unit: 'ครั้ง/เดือน', min: 1 },
      { key: 'combinedCounterYearLimit', label: 'จำกัดต่อปี', unit: 'ครั้ง/ปี', min: 1 },
    ],
  },
  {
    title: 'เกณฑ์มาสาย',
    icon: '⏰',
    fields: [
      { key: 'tardinessBonusThreshold', label: 'สายสะสมได้ไม่เกิน', unit: 'นาที/เดือน', hint: 'เกินกำหนดจะเสียเบี้ยขยัน/ค่าหยิบ' },
    ],
  },
  {
    title: 'ลาพักร้อน',
    icon: '🌴',
    fields: [
      { key: 'vacationAdvanceDays', label: 'ต้องยื่นล่วงหน้า', unit: 'วัน' },
      { key: 'vacationMaxConsecutive', label: 'ลาต่อเนื่องได้สูงสุด', unit: 'วัน/ครั้ง', min: 1 },
    ],
  },
  {
    title: 'ลาป่วย',
    icon: '🏥',
    fields: [
      { key: 'sickCertRequiredDays', label: 'ต้องมีใบรับรองแพทย์เมื่อป่วยตั้งแต่', unit: 'วันขึ้นไป', min: 1 },
    ],
  },
]

// The special "org default" pseudo-group edits SystemSettings directly.
const ORG_DEFAULT = '__org_default__'

export default function SystemSettingsPage() {
  const { profile: actor } = useAuth()
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [groups, setGroups] = useState<EmployeeGroup[]>([])
  const [activeId, setActiveId] = useState<string>(ORG_DEFAULT)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [newHoliday, setNewHoliday] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSettings(), listGroups()])
      .then(([s, g]) => { setSettings(s); setGroups(g) })
      .catch(() => setSettings(DEFAULT_SETTINGS))
      .finally(() => setLoading(false))
  }, [])

  const activeGroup = groups.find((g) => g.id === activeId) ?? null
  const isOrg = activeId === ORG_DEFAULT
  // The object whose numeric fields we are editing (org settings or a group).
  const editing: GroupSettings | null = isOrg ? settings : activeGroup

  function setNum(key: keyof GroupSettings, value: string) {
    const n = value === '' ? 0 : Number(value)
    if (Number.isNaN(n)) return
    if (isOrg && settings) {
      setSettings({ ...settings, [key]: n })
    } else if (activeGroup) {
      setGroups((prev) => prev.map((g) => g.id === activeGroup.id ? { ...g, [key]: n } : g))
    }
    setSaved(false)
  }

  function addHoliday() {
    if (!settings || !newHoliday) return
    if (settings.holidays.includes(newHoliday)) { setNewHoliday(''); return }
    setSettings({ ...settings, holidays: [...settings.holidays, newHoliday].sort() })
    setNewHoliday('')
    setSaved(false)
  }

  function removeHoliday(date: string) {
    if (!settings) return
    setSettings({ ...settings, holidays: settings.holidays.filter((h) => h !== date) })
    setSaved(false)
  }

  async function handleAddGroup() {
    const name = newGroupName.trim()
    if (!name || !actor) return
    setSaving(true)
    try {
      const id = await createGroup(name, actor)
      const fresh = await listGroups()
      setGroups(fresh)
      setNewGroupName('')
      setActiveId(id)
    } catch {
      setError('สร้างกลุ่มไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteGroup() {
    if (!activeGroup || !actor) return
    if (!window.confirm(`ลบกลุ่ม "${activeGroup.name}" ? พนักงานในกลุ่มนี้จะกลับไปใช้ค่าเริ่มต้นของระบบ`)) return
    setSaving(true)
    try {
      await deleteGroup(activeGroup.id, activeGroup.name, actor)
      setGroups((prev) => prev.filter((g) => g.id !== activeGroup.id))
      setActiveId(ORG_DEFAULT)
    } catch {
      setError('ลบกลุ่มไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    if (!actor) return
    setSaving(true)
    setError('')
    try {
      if (isOrg && settings) {
        await updateSettings(settings, actor)
      } else if (activeGroup) {
        await updateGroup(activeGroup, actor)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) return <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-24">
      <div>
        <h1 className="text-xl font-bold text-gray-800">⚙️ ตั้งค่าระบบ</h1>
        <p className="text-sm text-gray-500 mt-0.5">กำหนดเงื่อนไขและโควต้า — แยกตามกลุ่มพนักงานได้</p>
      </div>

      {/* Group selector */}
      <div className="card">
        <div className="card-title">👥 เลือกกลุ่มที่จะตั้งค่า</div>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setActiveId(ORG_DEFAULT)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              isOrg ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
            }`}
          >
            ⭐ ค่าเริ่มต้นของระบบ
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveId(g.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                activeId === g.id ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Add group */}
        <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="ชื่อกลุ่มใหม่ เช่น พนักงานคลัง"
            className="input flex-1"
          />
          <button
            onClick={handleAddGroup}
            disabled={!newGroupName.trim() || saving}
            className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            + เพิ่มกลุ่ม
          </button>
        </div>

        {!isOrg && activeGroup && (
          <div className="flex items-center justify-between mt-3 bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-600">
              กำลังแก้กลุ่ม: <span className="font-semibold text-gray-800">{activeGroup.name}</span>
            </span>
            <button onClick={handleDeleteGroup} className="text-xs text-red-500 hover:text-red-700 font-medium">
              🗑️ ลบกลุ่มนี้
            </button>
          </div>
        )}
        {isOrg && (
          <p className="text-xs text-gray-400 mt-2">
            ⭐ ค่านี้ใช้กับพนักงานที่ยังไม่ได้กำหนดกลุ่ม และเป็นค่าตั้งต้นเมื่อสร้างกลุ่มใหม่
          </p>
        )}
      </div>

      {/* Numeric settings for the active target */}
      {editing && SECTIONS.map((section) => (
        <div key={section.title} className="card">
          <div className="card-title">{section.icon} {section.title}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {section.fields.map((f) => (
              <div key={String(f.key)}>
                <label className="label">{f.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={f.min ?? 0}
                    value={editing[f.key]}
                    onChange={(e) => setNum(f.key, e.target.value)}
                    className="input w-24 text-center"
                  />
                  <span className="text-sm text-gray-500">{f.unit}</span>
                </div>
                {f.hint && <p className="text-xs text-gray-400 mt-1">{f.hint}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Holidays — org-wide, shared across all groups. Only shown on org default. */}
      {isOrg && (
        <div className="card">
          <div className="card-title">📅 วันหยุดประเพณี ({settings.holidays.length} วัน) · ใช้ร่วมทุกกลุ่ม</div>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
              className="input flex-1"
            />
            <button
              onClick={addHoliday}
              disabled={!newHoliday}
              className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40"
            >
              + เพิ่ม
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.holidays.length === 0 && <p className="text-sm text-gray-400">ยังไม่มีวันหยุด</p>}
            {settings.holidays.map((date) => (
              <span key={date} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-2.5 py-1.5 rounded-lg">
                {date}
                <button onClick={() => removeHoliday(date)} className="text-gray-400 hover:text-red-500 font-bold" title="ลบ">✕</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-white border-t border-gray-200 px-4 py-3 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="text-sm">
            {error && <span className="text-red-600">{error}</span>}
            {saved && <span className="text-green-600">✅ บันทึกแล้ว</span>}
            {!saved && !error && (
              <span className="text-gray-400 text-xs">
                {isOrg ? 'กำลังตั้งค่าเริ่มต้นของระบบ' : `กำลังตั้งค่ากลุ่ม "${activeGroup?.name}"`}
              </span>
            )}
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-8">
            {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}

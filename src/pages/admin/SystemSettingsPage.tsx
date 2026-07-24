import { useEffect, useState } from 'react'
import { SystemSettings } from '../../types'
import { getSettings, updateSettings, DEFAULT_SETTINGS } from '../../services/settingsService'
import { useAuth } from '../../hooks/useAuth'

interface NumField {
  key: keyof SystemSettings
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

export default function SystemSettingsPage() {
  const { profile: actor } = useAuth()
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [newHoliday, setNewHoliday] = useState('')

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SETTINGS))
  }, [])

  function setNum(key: keyof SystemSettings, value: string) {
    if (!settings) return
    const n = value === '' ? 0 : Number(value)
    if (Number.isNaN(n)) return
    setSettings({ ...settings, [key]: n })
    setSaved(false)
  }

  function addHoliday() {
    if (!settings || !newHoliday) return
    if (settings.holidays.includes(newHoliday)) { setNewHoliday(''); return }
    const holidays = [...settings.holidays, newHoliday].sort()
    setSettings({ ...settings, holidays })
    setNewHoliday('')
    setSaved(false)
  }

  function removeHoliday(date: string) {
    if (!settings) return
    setSettings({ ...settings, holidays: settings.holidays.filter((h) => h !== date) })
    setSaved(false)
  }

  async function handleSave() {
    if (!settings || !actor) return
    setSaving(true)
    setError('')
    try {
      await updateSettings(settings, actor)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  function resetDefaults() {
    setSettings({ ...DEFAULT_SETTINGS })
    setSaved(false)
  }

  if (!settings) return <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">⚙️ ตั้งค่าระบบ</h1>
          <p className="text-sm text-gray-500 mt-0.5">กำหนดเงื่อนไขและโควต้าต่างๆ ของทั้งระบบ</p>
        </div>
        <button onClick={resetDefaults} className="text-xs text-gray-400 hover:text-gray-600 underline">
          คืนค่าเริ่มต้น
        </button>
      </div>

      {SECTIONS.map((section) => (
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
                    value={settings[f.key] as number}
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

      {/* Holidays */}
      <div className="card">
        <div className="card-title">📅 วันหยุดประเพณี ({settings.holidays.length} วัน)</div>
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
          {settings.holidays.length === 0 && (
            <p className="text-sm text-gray-400">ยังไม่มีวันหยุด</p>
          )}
          {settings.holidays.map((date) => (
            <span
              key={date}
              className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-2.5 py-1.5 rounded-lg"
            >
              {date}
              <button
                onClick={() => removeHoliday(date)}
                className="text-gray-400 hover:text-red-500 font-bold"
                title="ลบ"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-white border-t border-gray-200 px-4 py-3 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="text-sm">
            {error && <span className="text-red-600">{error}</span>}
            {saved && <span className="text-green-600">✅ บันทึกแล้ว</span>}
            {settings.updatedByName && !saved && !error && (
              <span className="text-gray-400 text-xs">แก้ไขล่าสุดโดย {settings.updatedByName}</span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-8"
          >
            {saving ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  label: string
  used: number
  total: number
  icon: string
  onClick?: () => void
}

export default function QuotaCard({ label, used, total, icon, onClick }: Props) {
  const remaining = Math.max(total - used, 0)
  const pct = total > 0 ? (remaining / total) * 100 : 0
  const barColor = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-400' : 'bg-red-500'

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-gray-400 font-medium">{label}</span>
      </div>
      <div className="flex items-end gap-1 mb-2">
        <span className="text-3xl font-bold text-gray-800">{remaining}</span>
        <span className="text-sm text-gray-400 mb-1">/ {total} วัน</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">ใช้แล้ว {used} วัน</p>
    </div>
  )
}

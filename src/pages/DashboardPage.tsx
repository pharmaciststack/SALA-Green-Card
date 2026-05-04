import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuotas } from '../hooks/useQuotas'
import QuotaCard from '../components/dashboard/QuotaCard'
import CombinedCounter from '../components/dashboard/CombinedCounter'
import RecentRequests from '../components/dashboard/RecentRequests'

export default function DashboardPage() {
  const { profile } = useAuth()
  const { quota, stats } = useQuotas()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            สวัสดี, {profile?.displayName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {profile?.branchName} · {profile?.department}
          </p>
        </div>
        <Link
          to="/requests/new"
          className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          + ยื่นคำขอ
        </Link>
      </div>

      {/* Attendance stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.absences}</p>
            <p className="text-xs text-gray-500 mt-1">ขาดงาน (วัน)</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.leaves_taken}</p>
            <p className="text-xs text-gray-500 mt-1">วันลา (รวม)</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <p className={`text-2xl font-bold ${stats.tardiness_minutes > 30 ? 'text-red-600' : stats.tardiness_minutes > 0 ? 'text-yellow-600' : 'text-gray-800'}`}>
              {stats.tardiness_minutes}
            </p>
            <p className="text-xs text-gray-500 mt-1">มาสาย (นาที/เดือน)</p>
          </div>
        </div>
      )}

      {/* Leave quotas */}
      {quota && (
        <div>
          <h2 className="text-sm font-semibold text-gray-600 mb-3">สิทธิ์วันลาคงเหลือ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuotaCard
              label="ลากิจ"
              icon="📝"
              used={quota.personal_used}
              total={quota.personal_total}
              onClick={() => window.location.href = '/requests/new/personal-sick'}
            />
            <QuotaCard
              label="ลาป่วย"
              icon="🏥"
              used={quota.sick_used}
              total={quota.sick_total}
              onClick={() => window.location.href = '/requests/new/personal-sick'}
            />
            <QuotaCard
              label="ลาพักร้อน"
              icon="🌴"
              used={quota.vacation_used}
              total={quota.vacation_total}
              onClick={() => window.location.href = '/requests/new/vacation'}
            />
          </div>
        </div>
      )}

      {/* Combined counter + recent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats && <CombinedCounter stats={stats} />}
        <RecentRequests />
      </div>
    </div>
  )
}

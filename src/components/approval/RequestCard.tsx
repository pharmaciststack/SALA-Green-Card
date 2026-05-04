import { LeaveRequest } from '../../types'
import { REQUEST_TYPE_LABELS, REQUEST_TYPE_ICONS } from '../../utils/constants'
import { formatThaiDate } from '../../utils/dateUtils'

interface Props {
  request: LeaveRequest
  onReview: () => void
}

export default function RequestCard({ request, onReview }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">{REQUEST_TYPE_ICONS[request.type]}</span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{REQUEST_TYPE_LABELS[request.type]}</p>
            <p className="text-xs text-gray-500 mt-0.5">{request.submitterName}</p>
            <p className="text-xs text-gray-400">{request.createdAt ? formatThaiDate(request.createdAt) : ''}</p>
            {request.details.days && (
              <p className="text-xs text-gray-500 mt-1">{request.details.days} วัน</p>
            )}
            {request.details.date && (
              <p className="text-xs text-gray-500 mt-1">{request.details.date}</p>
            )}
          </div>
        </div>
        <button
          onClick={onReview}
          className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          พิจารณา
        </button>
      </div>
    </div>
  )
}

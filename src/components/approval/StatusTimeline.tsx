import { LeaveRequest } from '../../types'
import { formatThaiDateTime } from '../../utils/dateUtils'

interface Props { request: LeaveRequest }

export default function StatusTimeline({ request }: Props) {
  const steps = [
    {
      label: 'ยื่นคำขอ',
      actor: request.submitterName,
      timestamp: request.createdAt,
      done: true,
      action: 'submitted',
    },
    {
      label: 'เภสัชอนุมัติ',
      actor: request.pharmacistApproval?.name,
      timestamp: request.pharmacistApproval?.timestamp,
      done: !!request.pharmacistApproval,
      action: request.pharmacistApproval?.action,
      note: request.pharmacistApproval?.note,
    },
    {
      label: 'Area Manager อนุมัติ',
      actor: request.managerApproval?.name,
      timestamp: request.managerApproval?.timestamp,
      done: !!request.managerApproval,
      action: request.managerApproval?.action,
      note: request.managerApproval?.note,
    },
    {
      label: 'ผอ.อนุมัติ',
      actor: request.directorApproval?.name,
      timestamp: request.directorApproval?.timestamp,
      done: !!request.directorApproval,
      action: request.directorApproval?.action,
      note: request.directorApproval?.note,
    },
  ]

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const isRejected = step.action === 'rejected'
        const dotColor = !step.done
          ? 'bg-gray-200'
          : isRejected
            ? 'bg-red-500'
            : 'bg-green-500'
        const isLast = i === steps.length - 1

        return (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${dotColor}`} />
              {!isLast && <div className="w-0.5 bg-gray-200 flex-1 my-1" />}
            </div>
            <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
              <p className={`text-sm font-semibold ${!step.done ? 'text-gray-400' : isRejected ? 'text-red-600' : 'text-gray-800'}`}>
                {step.label}
                {step.action === 'approved' && ' ✓'}
                {step.action === 'rejected' && ' ✗'}
              </p>
              {step.actor && (
                <p className="text-xs text-gray-500 mt-0.5">{step.actor}</p>
              )}
              {step.timestamp && (
                <p className="text-xs text-gray-400">{formatThaiDateTime(step.timestamp)}</p>
              )}
              {step.note && (
                <p className="text-xs bg-gray-50 rounded-lg px-3 py-1.5 mt-1 text-gray-600 italic">"{step.note}"</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

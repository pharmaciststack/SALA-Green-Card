import { format, formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'

export function formatThaiDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'd MMMM yyyy', { locale: th })
}

export function formatThaiDateTime(date: Date): string {
  return format(date, 'd MMM yyyy HH:mm น.', { locale: th })
}

export function timeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: th })
}

export function toDateInputValue(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function getTodayString(): string {
  return toDateInputValue(new Date())
}

export function getMinVacationDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return toDateInputValue(d)
}

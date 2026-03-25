import {format, isValid, parse, sub} from 'date-fns'

export const DATE_FORMAT = 'yyyy-MM-dd'

export function today(): string {
  return format(new Date(), DATE_FORMAT)
}

export function parseDate(input: string): string {
  if (input === 'today') return today()
  if (input === 'yesterday') return format(sub(new Date(), {days: 1}), DATE_FORMAT)

  const parsed = parse(input, DATE_FORMAT, new Date())
  if (!isValid(parsed)) {
    throw new Error(`Invalid date "${input}". Use YYYY-MM-DD, "today", or "yesterday".`)
  }

  return format(parsed, DATE_FORMAT)
}

export function dateRange(from: string, to: string): string[] {
  const start = parse(from, DATE_FORMAT, new Date())
  const end = parse(to, DATE_FORMAT, new Date())
  const dates: string[] = []
  const current = new Date(start)
  while (current <= end) {
    dates.push(format(current, DATE_FORMAT))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

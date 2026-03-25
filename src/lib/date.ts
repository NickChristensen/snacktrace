import {add, format, isValid, parse, sub} from 'date-fns'

export const DATE_FORMAT = 'yyyy-MM-dd'

export function today(): string {
  return format(new Date(), DATE_FORMAT)
}

const RELATIVE_DATE = /^([+-]?)(\d+)([dwmy])$/i

function applyRelativeOffset(amount: number, unit: 'd' | 'w' | 'm' | 'y'): Date {
  const duration =
    unit === 'd'
      ? {days: Math.abs(amount)}
      : unit === 'w'
      ? {weeks: Math.abs(amount)}
      : unit === 'm'
      ? {months: Math.abs(amount)}
      : unit === 'y'
      ? {years: Math.abs(amount)}
      : null

  if (!duration) {
    throw new Error(`Unsupported relative unit "${unit}"`)
  }

  if (amount === 0) {
    return new Date()
  }

  return amount > 0 ? add(new Date(), duration) : sub(new Date(), duration)
}

function parseRelative(input: string): Date | null {
  const match = RELATIVE_DATE.exec(input)
  if (!match) return null

  const [, sign, value, unit] = match
  const quantity = Number(value)
  if (!Number.isFinite(quantity)) return null

  const amount = sign === '-' ? -quantity : quantity
  return applyRelativeOffset(amount, unit.toLowerCase() as 'd' | 'w' | 'm' | 'y')
}

export function parseDate(input: string): string {
  const normalized = input.trim()
  const lower = normalized.toLowerCase()

  if (lower === 'today') {
    return today()
  }

  if (lower === 'yesterday') {
    return format(sub(new Date(), {days: 1}), DATE_FORMAT)
  }

  const relative = parseRelative(lower)
  if (relative) {
    return format(relative, DATE_FORMAT)
  }

  const parsed = parse(normalized, DATE_FORMAT, new Date())
  if (!isValid(parsed)) {
    throw new Error(
      `Invalid date "${input}". Use YYYY-MM-DD, "today", "yesterday", or a relative offset like "-1w".`
    )
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

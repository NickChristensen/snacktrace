import type {FoodNomsDatabase} from './db.js'

export type Nutrients = Record<string, number>
export type GoalMode = 'maximum' | 'minimum' | 'range' | 'tracking'

type EntryRow = {
  id: number
  entryID: string | Buffer | null
  date: string | null
  tzID: string | null
  day: number | null
  mealTypeID: string | Buffer | null
  name: string | null
  calories: number | null
  quantity: number | null
  baseAmount: number | null
  baseUnit: string | null
  nutrients: string | Buffer | null
  foodID: string | Buffer | null
  brandOwner: string | null
  barcode: string | null
  source: string | null
}

type GoalRule = {
  id: number
  ruleID: string | Buffer | null
  goalType: string
  startDay: number | null
  dayOfWeek: number | null
  mode: number | null
  lowerBound: number | null
  upperBound: number | null
  isOverride: number | null
  dateCreated: string | null
}

const MEAL_NAMES: Record<string, string> = {1: 'Breakfast', 2: 'Lunch', 3: 'Dinner', 4: 'Snack', 5: 'Pre-Workout', 6: 'Post-Workout'}
const MODE: Record<number, GoalMode> = {1: 'maximum', 2: 'minimum', 3: 'range', 4: 'tracking'}
const GOAL_NUTRIENT: Record<string, string> = {calorie: 'calories', carbohydrate: 'carbs'}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value)
}

export function normalizeId(value: string | Buffer | null): string | null {
  if (value === null) return null
  const hex = Buffer.isBuffer(value) ? value.toString('hex') : Buffer.from(value, 'latin1').toString('hex')
  if (hex.length === 32) return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`.toLowerCase()
  return Buffer.isBuffer(value) ? value.toString('utf8') : value
}

function binaryDatabaseId(value: string): Buffer | undefined {
  const hex = value.replaceAll('-', '')
  return /^[0-9a-f]{32}$/i.test(hex) ? Buffer.from(hex, 'hex') : undefined
}

function numeric(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? round(value) : undefined
}

function parseNutrients(value: string | Buffer | null): Nutrients {
  if (value === null) return {}
  try {
    const parsed = JSON.parse(Buffer.isBuffer(value) ? value.toString('utf8') : value) as Record<string, unknown>
    return Object.fromEntries(Object.entries(parsed).flatMap(([name, scalar]) => {
      const result = numeric(scalar)
      return result === undefined ? [] : [[name, result]]
    }))
  } catch {
    return {}
  }
}

function round(value: number): number {
  return Number(value.toFixed(4))
}

function scaleNutrients(row: EntryRow): Nutrients {
  const raw = parseNutrients(row.nutrients)
  const rawCalories = raw.calories
  const scale = rawCalories && rawCalories > 0 ? (row.calories ?? 0) / rawCalories : (row.baseAmount ?? 0) > 0 ? (row.quantity ?? 0) / (row.baseAmount ?? 1) : 1
  return Object.fromEntries(Object.entries(raw).map(([name, amount]) => [name, round(amount * scale)]))
}

function sumNutrients(items: Nutrients[]): Nutrients {
  const result: Nutrients = {}
  for (const item of items) for (const [name, amount] of Object.entries(item)) result[name] = (result[name] ?? 0) + amount
  return Object.fromEntries(Object.entries(result).map(([name, amount]) => [name, round(amount)]))
}

function formatTimestamp(value: string | null): string | null {
  if (!value) return null
  const isoLike = value.replace(' ', 'T')
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(isoLike) ? isoLike : `${isoLike}Z`
  const date = new Date(normalized)
  return Number.isNaN(date.valueOf()) ? value : date.toISOString()
}

function entry(row: EntryRow) {
  return {
    entryId: normalizeId(row.entryID),
    foodId: normalizeId(row.foodID),
    name: row.name ?? '',
    timestamp: formatTimestamp(row.date),
    tzId: row.tzID ?? 'UTC',
    mealTypeId: normalizeId(row.mealTypeID),
    calories: round(row.calories ?? 0),
    quantity: numeric(row.quantity),
    baseAmount: numeric(row.baseAmount),
    baseUnit: row.baseUnit ?? null,
    brandOwner: row.brandOwner,
    barcode: row.barcode,
    source: row.source,
    nutrients: scaleNutrients(row),
  }
}

function rowsForDay(db: FoodNomsDatabase, date: string): EntryRow[] {
  return db.sqlite.prepare(`SELECT id, entryID, date, tzID, day, mealTypeID, name, calories, quantity, baseAmount, baseUnit, nutrients, foodID, brandOwner, barcode, source FROM foodEntryRecord WHERE day IS NOT NULL AND date(day) = ? ORDER BY date ASC, id ASC`).all(date) as EntryRow[]
}

function mealTypes(db: FoodNomsDatabase): Map<string, {name: string; sortIndex: number}> {
  const rows = db.sqlite.prepare('SELECT mealTypeID, name, sortIndex FROM mealTypeRecord').all() as Array<{mealTypeID: string | Buffer; name: string | null; sortIndex: number}>
  return new Map(rows.map((row) => [normalizeId(row.mealTypeID) ?? '', {name: row.name || MEAL_NAMES[normalizeId(row.mealTypeID) ?? ''] || 'Meal', sortIndex: row.sortIndex}]))
}

function foundationWeekday(date: string): number {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay() + 1
}

function dateDay(db: FoodNomsDatabase, date: string): number {
  return (db.sqlite.prepare('SELECT julianday(?) AS value').get(date) as {value: number}).value
}

function resolveRule(rules: GoalRule[], date: string, day: number): GoalRule | undefined {
  const active = rules.filter((rule) => (rule.startDay === null || rule.startDay <= day))
  const overrides = active.filter((rule) => Boolean(rule.isOverride) && rule.dayOfWeek === foundationWeekday(date))
  const generic = active.filter((rule) => !Boolean(rule.isOverride) && rule.dayOfWeek === null)
  return [...(overrides.length ? overrides : generic)].sort((a, b) => (b.startDay ?? -Infinity) - (a.startDay ?? -Infinity) || b.id - a.id)[0]
}

function status(mode: GoalMode, actual: number, lower: number | null, upper: number | null): 'below' | 'within' | 'above' | 'tracking' {
  if (mode === 'tracking') return 'tracking'
  if (mode === 'maximum') return upper !== null && actual > upper ? 'above' : 'within'
  if (mode === 'minimum') return lower !== null && actual < lower ? 'below' : 'within'
  if (lower !== null && actual < lower) return 'below'
  if (upper !== null && actual > upper) return 'above'
  return 'within'
}

function goalsFor(db: FoodNomsDatabase, date: string, totals: Nutrients) {
  const goals = db.sqlite.prepare('SELECT goalID, goalType, sortIndex FROM goalRecord ORDER BY sortIndex ASC, goalType ASC').all() as Array<{goalID: string | Buffer; goalType: string; sortIndex: number}>
  const rules = db.sqlite.prepare('SELECT rowid AS id, ruleID, goalType, startDay, dayOfWeek, mode, lowerBound, upperBound, isOverride, dateCreated FROM goalRuleRecord').all() as GoalRule[]
  const day = dateDay(db, date)
  return goals.map((goal) => {
    const rule = resolveRule(rules.filter((item) => item.goalType === goal.goalType), date, day)
    const mode = MODE[rule?.mode ?? 4] ?? 'tracking'
    const actual = round(totals[GOAL_NUTRIENT[goal.goalType] ?? goal.goalType] ?? 0)
    const lowerBound = numeric(rule?.lowerBound) ?? null
    const upperBound = numeric(rule?.upperBound) ?? null
    const singleBound = [lowerBound, upperBound].filter((bound) => bound !== null && bound !== 0)
    const ratio = (mode === 'maximum' || mode === 'minimum') && singleBound.length === 1 ? round(actual / singleBound[0]!) : null
    return {goalId: normalizeId(goal.goalID), type: goal.goalType, mode, lowerBound, upperBound, actual, status: status(mode, actual, lowerBound, upperBound), ratio}
  })
}

function summarizeDay(db: FoodNomsDatabase, date: string, raw: EntryRow[], definitions = mealTypes(db)) {
  const entries = raw.map(entry)
  const totals = sumNutrients(entries.map((item) => item.nutrients))
  totals.calories = round(raw.reduce((total, item) => total + (item.calories ?? 0), 0))
  const grouped = new Map<string, typeof entries>()
  for (const item of entries) {
    const key = item.mealTypeId ?? ''
    grouped.set(key, [...(grouped.get(key) ?? []), item])
  }
  const meals = [...grouped.entries()].map(([mealTypeId, items]) => ({mealTypeId: mealTypeId || null, name: definitions.get(mealTypeId)?.name ?? 'Meal', sortIndex: definitions.get(mealTypeId)?.sortIndex ?? Number.MAX_SAFE_INTEGER, totals: {calories: round(items.reduce((total, item) => total + item.calories, 0)), nutrients: sumNutrients(items.map((item) => item.nutrients))}, entries: items})).sort((a, b) => a.sortIndex - b.sortIndex)
  return {date, totals: {calories: totals.calories, nutrients: Object.fromEntries(Object.entries(totals).filter(([name]) => name !== 'calories'))}, goals: goalsFor(db, date, totals), meals, entries}
}

export function daySummary(db: FoodNomsDatabase, date: string) {
  return summarizeDay(db, date, rowsForDay(db, date))
}

export function rangeSummary(db: FoodNomsDatabase, from: string, to: string) {
  const dates: string[] = []
  for (let current = new Date(`${from}T00:00:00.000Z`), end = new Date(`${to}T00:00:00.000Z`); current <= end; current.setUTCDate(current.getUTCDate() + 1)) dates.push(current.toISOString().slice(0, 10))
  // A single bounded SQLite scan prevents the range endpoint from issuing one entry query per day.
  const rows = db.sqlite.prepare(`SELECT id, entryID, date, tzID, day, mealTypeID, name, calories, quantity, baseAmount, baseUnit, nutrients, foodID, brandOwner, barcode, source, date(day) AS localDate FROM foodEntryRecord WHERE day IS NOT NULL AND date(day) BETWEEN ? AND ? ORDER BY date ASC, id ASC`).all(from, to) as Array<EntryRow & {localDate: string}>
  const rowsByDate = new Map<string, EntryRow[]>()
  for (const row of rows) {
    rowsByDate.set(row.localDate, [...(rowsByDate.get(row.localDate) ?? []), row])
  }
  const definitions = mealTypes(db)
  const daily = dates.map((date) => summarizeDay(db, date, rowsByDate.get(date) ?? [], definitions))
  const nutrients = sumNutrients(daily.map((day) => ({...day.totals.nutrients, calories: day.totals.calories})))
  const averages = Object.fromEntries(Object.entries(nutrients).map(([name, amount]) => [name, round(amount / dates.length)]))
  const goalSummaries = new Map<string, {type: string; actualTotal: number; statuses: Record<string, number>; count: number}>()
  for (const day of daily) for (const goal of day.goals) {
    const summary = goalSummaries.get(goal.type) ?? {type: goal.type, actualTotal: 0, statuses: {}, count: 0}
    summary.actualTotal += goal.actual
    summary.statuses[goal.status] = (summary.statuses[goal.status] ?? 0) + 1
    summary.count++
    goalSummaries.set(goal.type, summary)
  }
  return {from, to, dayCount: dates.length, totals: {calories: nutrients.calories ?? 0, nutrients: Object.fromEntries(Object.entries(nutrients).filter(([name]) => name !== 'calories'))}, averages: {calories: averages.calories ?? 0, nutrients: Object.fromEntries(Object.entries(averages).filter(([name]) => name !== 'calories'))}, items: daily.map((item) => ({date: item.date, totals: item.totals, goals: item.goals})), goalSummary: [...goalSummaries.values()].map((item) => ({type: item.type, averageActual: round(item.actualTotal / item.count), statusCounts: item.statuses}))}
}

export function allGoals(db: FoodNomsDatabase) {
  const goals = db.sqlite.prepare('SELECT goalID, goalType, sortIndex FROM goalRecord ORDER BY sortIndex ASC, goalType ASC').all() as Array<{goalID: string | Buffer; goalType: string; sortIndex: number}>
  const rules = db.sqlite.prepare('SELECT rowid AS id, ruleID, goalType, startDay, dayOfWeek, mode, lowerBound, upperBound, isOverride, dateCreated FROM goalRuleRecord ORDER BY goalType ASC, startDay ASC, rowid ASC').all() as GoalRule[]
  return {items: goals.map((goal) => ({goalId: normalizeId(goal.goalID), type: goal.goalType, history: rules.filter((rule) => rule.goalType === goal.goalType).map((rule) => ({ruleId: normalizeId(rule.ruleID), effectiveDate: rule.startDay === null ? null : (db.sqlite.prepare('SELECT date(?) AS value').get(rule.startDay) as {value: string}).value, startDay: rule.startDay, weekday: rule.dayOfWeek, isOverride: Boolean(rule.isOverride), mode: MODE[rule.mode ?? 4] ?? 'tracking', lowerBound: rule.lowerBound, upperBound: rule.upperBound}))}))}
}

export function listFoods(db: FoodNomsDatabase, options: {q?: string; limit: number; sort: 'name' | '-lastLoggedAt'; cursor?: string}) {
  let cursor: {name: string; date: string | null; id: string; sort: 'name' | '-lastLoggedAt'; q: string} | undefined
  if (options.cursor) {
    try { cursor = JSON.parse(Buffer.from(options.cursor, 'base64url').toString('utf8')) as typeof cursor } catch { throw new Error('Invalid cursor') }
    if (!cursor || typeof cursor.name !== 'string' || (typeof cursor.date !== 'string' && cursor.date !== null) || typeof cursor.id !== 'string' || cursor.sort !== options.sort || cursor.q !== (options.q ?? '')) throw new Error('Invalid cursor')
  }
  const clauses = ['foodID IS NOT NULL']
  const params: unknown[] = []
  if (options.q) { clauses.push('(name LIKE ? COLLATE NOCASE OR brandOwner LIKE ? COLLATE NOCASE)'); params.push(`%${options.q}%`, `%${options.q}%`) }
  if (cursor) {
    const cursorIsUndated = cursor.date === null || cursor.date === ''
    if (options.sort === 'name') {
      if (cursorIsUndated) {
        clauses.push('(name COLLATE NOCASE > ? OR (name COLLATE NOCASE = ? AND lastLoggedAt IS NULL AND foodKey > ?))')
        params.push(cursor.name, cursor.name, cursor.id)
      } else {
        clauses.push('(name COLLATE NOCASE > ? OR (name COLLATE NOCASE = ? AND (lastLoggedAt IS NULL OR lastLoggedAt < ? OR (lastLoggedAt = ? AND foodKey > ?))))')
        params.push(cursor.name, cursor.name, cursor.date, cursor.date, cursor.id)
      }
    } else {
      if (cursorIsUndated) {
        clauses.push('(lastLoggedAt IS NULL AND (name COLLATE NOCASE > ? OR (name COLLATE NOCASE = ? AND foodKey > ?)))')
        params.push(cursor.name, cursor.name, cursor.id)
      } else {
        clauses.push('(lastLoggedAt IS NULL OR lastLoggedAt < ? OR (lastLoggedAt = ? AND (name COLLATE NOCASE > ? OR (name COLLATE NOCASE = ? AND foodKey > ?))))')
        params.push(cursor.date, cursor.date, cursor.name, cursor.name, cursor.id)
      }
    }
  }
  const order = options.sort === 'name' ? 'name COLLATE NOCASE ASC, lastLoggedAt DESC, foodKey ASC' : 'lastLoggedAt DESC, name COLLATE NOCASE ASC, foodKey ASC'
  const sql = `WITH latest AS (SELECT foodID, MAX(date) AS lastLoggedAt FROM foodEntryRecord WHERE foodID IS NOT NULL GROUP BY foodID), snapshots AS (SELECT e.*, l.lastLoggedAt, hex(e.foodID) AS foodKey FROM foodEntryRecord e JOIN latest l ON l.foodID = e.foodID AND e.date IS l.lastLoggedAt WHERE e.id = (SELECT MAX(candidate.id) FROM foodEntryRecord candidate WHERE candidate.foodID = e.foodID AND candidate.date IS l.lastLoggedAt)) SELECT id, foodID, name, brandOwner, baseAmount, baseUnit, nutrients, source, barcode, lastLoggedAt, foodKey FROM snapshots WHERE ${clauses.join(' AND ')} ORDER BY ${order} LIMIT ?`
  const rows = db.sqlite.prepare(sql).all(...params, options.limit + 1) as Array<EntryRow & {lastLoggedAt: string | null; foodKey: string}>
  const selected = rows.slice(0, options.limit)
  const foods = selected.map((row) => ({foodId: normalizeId(row.foodID), name: row.name ?? '', brandOwner: row.brandOwner, baseAmount: numeric(row.baseAmount), baseUnit: row.baseUnit, source: row.source, barcode: row.barcode, lastLoggedAt: formatTimestamp(row.lastLoggedAt), nutrients: parseNutrients(row.nutrients)}))
  const last = selected.at(-1)
  const nextCursor = rows.length > options.limit && last ? Buffer.from(JSON.stringify({name: last.name ?? '', date: last.lastLoggedAt, id: last.foodKey, sort: options.sort, q: options.q ?? ''})).toString('base64url') : undefined
  return nextCursor ? {items: foods, nextCursor} : {items: foods}
}

export function foodSnapshot(db: FoodNomsDatabase, foodId: string) {
  const binaryId = binaryDatabaseId(foodId)
  const row = (binaryId
    ? db.sqlite.prepare('SELECT id, foodID, name, brandOwner, baseAmount, baseUnit, nutrients, source, barcode, date FROM foodEntryRecord WHERE foodID = ? OR foodID = ? ORDER BY date DESC, id DESC LIMIT 1').get(foodId, binaryId)
    : db.sqlite.prepare('SELECT id, foodID, name, brandOwner, baseAmount, baseUnit, nutrients, source, barcode, date FROM foodEntryRecord WHERE foodID = ? ORDER BY date DESC, id DESC LIMIT 1').get(foodId)) as EntryRow | undefined
  if (!row) return undefined
  return {foodId: normalizeId(row.foodID), name: row.name ?? '', brandOwner: row.brandOwner, baseAmount: numeric(row.baseAmount), baseUnit: row.baseUnit, source: row.source, barcode: row.barcode, lastLoggedAt: formatTimestamp(row.date), nutrients: parseNutrients(row.nutrients)}
}

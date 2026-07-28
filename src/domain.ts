import type {FoodNomsDatabase} from './db.js'

export type Nutrients = Record<string, number>
export type GoalMode = 'maximum' | 'minimum' | 'range' | 'tracking'

export class InvalidFoodCursorError extends Error {
  constructor() {
    super('Invalid cursor')
    this.name = 'InvalidFoodCursorError'
  }
}

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
  collectionEditID?: string | Buffer | null
  collectionSortIndex?: number | null
  measure?: string | Buffer | null
}

type CollectionRow = {
  collectionID: string | Buffer | null
  collectionEditID: string | Buffer | null
  name: string | null
  collectionType: number
  dateCreated: string | null
  dateLastUpdated: string | null
  servings: number | null
  servingSizeUnit: string | null
  totalServingSize: number | null
  color: string | null
  icon: string | null
  urlString: string | null
  notes: string | null
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
  targetValue: number | null
  toleranceValue: number | null
  toleranceUnit: number | null
  relativeFractionalTargetValue: number | null
  relativeFractionalLowerBound: number | null
  relativeFractionalUpperBound: number | null
  relativePercentageLowerBound: number | null
  relativePercentageUpperBound: number | null
  relativeToCalorieGoal: number | null
  minimum: number | null
}

type EffectiveRow = {id: number; startDay: number | null; dateCreated: string | null}

type EnergyStrategy = EffectiveRow & {method: number | null; manualTotalEnergy: number | null; restingEnergyCalculationMode: number | null; manualRestingEnergy: number | null; includedEnergyComponents: number | null; activeEnergyScaleFactor: number | null}
type WeightGoal = EffectiveRow & {desiredWeightChangePerWeek: number | null; isOverride: number | null}
type MacroGoalStrategy = EffectiveRow & {
  mode: number | null
  proteinUnit: string | null
  proteinValue: number | null
  carbsUnit: string | null
  carbsValue: number | null
  fatUnit: string | null
  fatValue: number | null
  toleranceValue: number | null
  toleranceUnit: number | null
  isOverride: number | null
}
type BodyMetric = EffectiveRow & {metricType: number | null; value: number | null}
type ActivityEntry = EffectiveRow & {activityType: string | null; value: number | null}
type BodyProfile = {id: number; dateCreated: string | null; sex: number | null; birthdate: number | null}
type GoalDefinition = {goalID: string | Buffer; goalType: string; sortIndex: number}
type GoalResult = {goalId: string | null; type: string; target: number | null; lowerBound: number | null; upperBound: number | null; actual: number}

type GoalContext = {
  goals: GoalDefinition[]
  rules: GoalRule[]
  energyStrategies: EnergyStrategy[]
  weightGoals: WeightGoal[]
  macroStrategies: MacroGoalStrategy[]
  bodyMetrics: BodyMetric[]
  activity: ActivityEntry[]
  profiles: BodyProfile[]
}

const MEAL_NAMES: Record<string, string> = {1: 'Breakfast', 2: 'Lunch', 3: 'Dinner', 4: 'Snack', 5: 'Pre-Workout', 6: 'Post-Workout'}
const MODE: Record<number, GoalMode> = {1: 'maximum', 2: 'minimum', 3: 'range', 4: 'tracking'}
const GOAL_NUTRIENT: Record<string, string> = {calorie: 'calories', carbohydrate: 'carbs'}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value)
}

export function inclusiveDayCount(from: string, to: string): number {
  return (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86_400_000 + 1
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

function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
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

type Measure = {descriptionQuantity?: number; descriptionText?: string; unit?: string; value?: number; traits?: number}

function parseMeasure(value: string | Buffer | null): Measure | undefined {
  if (value === null || value === undefined) return undefined
  try {
    const parsed = JSON.parse(Buffer.isBuffer(value) ? value.toString('utf8') : value) as unknown
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return undefined
    const source = parsed as Record<string, unknown>
    const measure: Measure = {}
    if (typeof source.descriptionQuantity === 'number' && Number.isFinite(source.descriptionQuantity)) measure.descriptionQuantity = round(source.descriptionQuantity)
    if (typeof source.descriptionText === 'string') measure.descriptionText = source.descriptionText
    if (typeof source.unit === 'string') measure.unit = source.unit
    if (typeof source.value === 'number' && Number.isFinite(source.value)) measure.value = round(source.value)
    if (typeof source.traits === 'number' && Number.isFinite(source.traits)) measure.traits = round(source.traits)
    return Object.keys(measure).length ? measure : undefined
  } catch {
    return undefined
  }
}

function round(value: number): number {
  return Number(value.toFixed(4))
}

function scaleNutrients(row: EntryRow): Nutrients {
  const raw = parseNutrients(row.nutrients)
  const rawCalories = raw.calories
  const scale = rawCalories && rawCalories > 0 ? (row.calories ?? 0) / rawCalories : (row.baseAmount ?? 0) > 0 ? (row.quantity ?? 0) / (row.baseAmount ?? 1) : 1
  return Object.fromEntries(Object.entries(raw).flatMap(([name, amount]) => name === 'calories' ? [] : [[name, round(amount * scale)]]))
}

function foodNutrients(value: string | Buffer | null): {calories?: number; nutrients: Nutrients} {
  const {calories, ...nutrients} = parseNutrients(value)
  return calories === undefined ? {nutrients} : {calories, nutrients}
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
  void db
  return Date.parse(`${date}T00:00:00.000Z`) / 86_400_000 + 2_440_587.5
}

function effectiveFor<T extends EffectiveRow>(rows: T[], day: number): T | undefined {
  return rows.filter((row) => row.startDay === null || row.startDay <= day).sort((a, b) => (b.startDay ?? -Infinity) - (a.startDay ?? -Infinity) || (b.dateCreated ?? '').localeCompare(a.dateCreated ?? '') || b.id - a.id)[0]
}

function effectiveStrategy<T extends EffectiveRow & {isOverride: number | null}>(rows: T[], day: number): T | undefined {
  return effectiveFor(rows.filter((row) => Boolean(row.isOverride) && row.startDay === day), day) ?? effectiveFor(rows.filter((row) => !Boolean(row.isOverride)), day)
}

function resolveRule(rules: GoalRule[], date: string, day: number): GoalRule | undefined {
  const active = rules.filter((rule) => rule.startDay === null || rule.startDay <= day)
  const overrides = active.filter((rule) => Boolean(rule.isOverride) && rule.dayOfWeek === foundationWeekday(date))
  const generic = active.filter((rule) => !Boolean(rule.isOverride) && rule.dayOfWeek === null)
  return effectiveFor(overrides.length ? overrides : generic, day)
}

function relativeGoalAmount(type: string, fraction: number | null, calorieTarget: number | null): number | null {
  if (fraction === null || calorieTarget === null) return null
  const caloriesPerGram = type === 'fat' ? 9 : type === 'protein' || type === 'carbohydrate' ? 4 : null
  return caloriesPerGram === null ? null : calorieTarget * fraction / caloriesPerGram
}

function relativeGoalFraction(rule: GoalRule | undefined, kind: 'target' | 'lower' | 'upper'): number | null {
  if (!Boolean(rule?.relativeToCalorieGoal)) return null
  const fractional = kind === 'target'
    ? finite(rule?.relativeFractionalTargetValue)
    : kind === 'lower'
      ? finite(rule?.relativeFractionalLowerBound)
      : finite(rule?.relativeFractionalUpperBound)
  if (fractional !== undefined) return fractional
  if (kind === 'target') return null
  const percentage = finite(kind === 'lower' ? rule?.relativePercentageLowerBound : rule?.relativePercentageUpperBound)
  return percentage === undefined ? null : percentage / 100
}

function targetForRule(rule: GoalRule | undefined, type?: string, calorieTarget?: number | null): number | null {
  const relativeTarget = type ? relativeGoalAmount(type, relativeGoalFraction(rule, 'target'), calorieTarget ?? null) : null
  if (relativeTarget !== null) return relativeTarget
  const target = numeric(rule?.targetValue)
  if (target !== undefined) return target
  const lower = numeric(rule?.lowerBound) ?? null
  const upper = numeric(rule?.upperBound) ?? null
  const mode = MODE[rule?.mode ?? 4] ?? 'tracking'
  if (mode === 'minimum') return lower ?? upper ?? null
  if (mode === 'maximum') return upper ?? lower ?? null
  if (mode === 'range' && lower !== null && upper !== null) return round((lower + upper) / 2)
  return null
}

function boundsForRule(rule: GoalRule | undefined, target: number | null, type?: string, calorieTarget?: number | null): {lowerBound: number | null; upperBound: number | null} {
  const lowerBound = (type ? relativeGoalAmount(type, relativeGoalFraction(rule, 'lower'), calorieTarget ?? null) : null) ?? numeric(rule?.lowerBound) ?? null
  const upperBound = (type ? relativeGoalAmount(type, relativeGoalFraction(rule, 'upper'), calorieTarget ?? null) : null) ?? numeric(rule?.upperBound) ?? null
  if (target === null || numeric(rule?.toleranceValue) === undefined) {
    const mode = MODE[rule?.mode ?? 4] ?? 'tracking'
    if (mode === 'maximum') return {lowerBound: null, upperBound}
    if (mode === 'minimum') return {lowerBound, upperBound: null}
    if (mode === 'range') return {lowerBound, upperBound}
    return {lowerBound: null, upperBound: null}
  }
  const tolerance = numeric(rule?.toleranceValue)!
  if (rule?.toleranceUnit === 1) return {lowerBound: round(target * (1 - tolerance)), upperBound: round(target * (1 + tolerance))}
  return {lowerBound: round(target - tolerance), upperBound: round(target + tolerance)}
}

function advancedMacroTarget(type: 'protein' | 'carbohydrate' | 'fat', unit: string | null, value: number | null, calorieTarget: number | null, weight: number | null, proteinTarget: number | null, fatTarget: number | null): number | null {
  if (unit === 'grams') return finite(value) ?? null
  if (unit === 'gramsPerBodyWeight' && value !== null && weight !== null) return finite(value) !== undefined && finite(weight) !== undefined ? value * weight : null
  if ((unit === 'percentage' || unit === 'percent') && value !== null && calorieTarget !== null) {
    const fraction = value > 1 ? value / 100 : value
    return calorieTarget * fraction / (type === 'fat' ? 9 : 4)
  }
  if (unit === 'remainder' && calorieTarget !== null && proteinTarget !== null && fatTarget !== null) return Math.max(0, (calorieTarget - proteinTarget * 4 - fatTarget * 9) / 4)
  return null
}

function activityValue(entries: ActivityEntry[], type: string, day: number): number | null {
  return finite(effectiveFor(entries.filter((entry) => entry.activityType === type && entry.startDay === day), day)?.value) ?? null
}

function automaticEnergyTarget(energy: EnergyStrategy, weightGoal: WeightGoal | undefined, floor: number, day: number, activity: ActivityEntry[], bodyMetrics: BodyMetric[], profiles: BodyProfile[]): number | null {
  const adjustment = (finite(weightGoal?.desiredWeightChangePerWeek) ?? 0) * 7700 / 7
  if (energy.method === 2 && finite(energy.manualTotalEnergy) !== undefined) return Math.max(floor, energy.manualTotalEnergy! + adjustment)
  if (energy.method !== 1) return null
  const resting = finite(energy.manualRestingEnergy) ?? (energy.restingEnergyCalculationMode === 3
    ? (() => {
        const values = Array.from({length: 7}, (_, index) => activityValue(activity, 'restingEnergy', day - index - 1)).filter((value): value is number => value !== null)
        return values.length === 7 ? values.reduce((sum, value) => sum + value, 0) / values.length : null
      })()
    : energy.restingEnergyCalculationMode === 1
      ? (() => {
          const weight = finite(effectiveFor(bodyMetrics.filter((entry) => entry.metricType === 1), day)?.value)
          const height = finite(effectiveFor(bodyMetrics.filter((entry) => entry.metricType === 2), day)?.value)
          const profile = [...profiles].sort((a, b) => (b.dateCreated ?? '').localeCompare(a.dateCreated ?? '') || b.id - a.id)[0]
          const birthdate = finite(profile?.birthdate)
          if (weight === undefined || height === undefined || birthdate === undefined || profile?.sex === null || profile?.sex === undefined) return null
          const age = (day - birthdate) / 365.2425
          return 10 * weight + 6.25 * height - 5 * age + (profile.sex === 1 ? 5 : -161)
        })()
      : null)
  if (resting === null) return null
  const active = energy.includedEnergyComponents ? activityValue(activity, 'activeEnergy', day) : 0
  if (active === null) return null
  return Math.max(floor, resting + active * (finite(energy.activeEnergyScaleFactor) ?? 1) + adjustment)
}

function loadGoalContext(db: FoodNomsDatabase): GoalContext {
  const goals = db.sqlite.prepare('SELECT goalID, goalType, sortIndex FROM goalRecord ORDER BY sortIndex ASC, goalType ASC').all() as GoalDefinition[]
  const tableColumns = (table: string) => new Set((db.sqlite.prepare(`PRAGMA table_info("${table}")`).all() as Array<{name: string}>).map((column) => column.name))
  const ruleColumns = tableColumns('goalRuleRecord')
  const ruleColumn = (column: string) => ruleColumns.has(column) ? column : `NULL AS ${column}`
  const rules = db.sqlite.prepare(`SELECT rowid AS id, ruleID, goalType, startDay, dayOfWeek, mode, lowerBound, upperBound, isOverride, dateCreated, ${ruleColumn('targetValue')}, ${ruleColumn('toleranceValue')}, ${ruleColumn('toleranceUnit')}, ${ruleColumn('relativeFractionalTargetValue')}, ${ruleColumn('relativeFractionalLowerBound')}, ${ruleColumn('relativeFractionalUpperBound')}, ${ruleColumn('relativePercentageLowerBound')}, ${ruleColumn('relativePercentageUpperBound')}, ${ruleColumn('relativeToCalorieGoal')}, ${ruleColumn('minimum')} FROM goalRuleRecord`).all() as GoalRule[]
  const hasTable = (table: string) => (db.sqlite.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(table) as unknown) !== undefined
  const energyStrategies = hasTable('energyStrategyRecord') ? db.sqlite.prepare('SELECT id, startDay, dateCreated, method, manualTotalEnergy, restingEnergyCalculationMode, manualRestingEnergy, includedEnergyComponents, activeEnergyScaleFactor FROM energyStrategyRecord').all() as EnergyStrategy[] : []
  const weightGoals = hasTable('weightGoalRecord') ? db.sqlite.prepare('SELECT id, startDay, dateCreated, desiredWeightChangePerWeek, isOverride FROM weightGoalRecord').all() as WeightGoal[] : []
  const macroStrategies = hasTable('macroGoalStrategyRecord') ? db.sqlite.prepare('SELECT id, startDay, dateCreated, mode, proteinUnit, proteinValue, carbsUnit, carbsValue, fatUnit, fatValue, toleranceValue, toleranceUnit, isOverride FROM macroGoalStrategyRecord').all() as MacroGoalStrategy[] : []
  const bodyMetrics = hasTable('bodyMetricEntryRecord') ? db.sqlite.prepare('SELECT id, day AS startDay, dateCreated, metricType, value FROM bodyMetricEntryRecord WHERE metricType IN (1, 2)').all() as BodyMetric[] : []
  const activity = hasTable('activityEntryRecord') ? db.sqlite.prepare("SELECT id, day AS startDay, dateCreated, activityType, value FROM activityEntryRecord WHERE activityType IN ('restingEnergy', 'activeEnergy')").all() as ActivityEntry[] : []
  const profiles = hasTable('bodyProfileRecord') && tableColumns('bodyProfileRecord').has('dateCreated') ? db.sqlite.prepare('SELECT id, dateCreated, sex, birthdate FROM bodyProfileRecord').all() as BodyProfile[] : []
  return {goals, rules, energyStrategies, weightGoals, macroStrategies, bodyMetrics, activity, profiles}
}

function goalsFor(db: FoodNomsDatabase, date: string, totals: Nutrients, context = loadGoalContext(db)): GoalResult[] {
  const day = dateDay(db, date)
  const energy = effectiveFor(context.energyStrategies, day)
  const weightGoal = effectiveStrategy(context.weightGoals, day)
  const macro = effectiveStrategy(context.macroStrategies, day)
  const weight = finite(effectiveFor(context.bodyMetrics.filter((entry) => entry.metricType === 1), day)?.value) ?? null
  const calorieRule = resolveRule(context.rules.filter((item) => item.goalType === 'calorie'), date, day)
  const calorieFloor = numeric(calorieRule?.minimum) ?? 0
  const automaticTarget = calorieRule?.mode === 4 && energy ? automaticEnergyTarget(energy, weightGoal, calorieFloor, day, context.activity, context.bodyMetrics, context.profiles) : null
  const isAutomatic = automaticTarget !== null
  const calorieTarget = isAutomatic ? automaticTarget : targetForRule(calorieRule)
  const advancedTargets = macro?.mode === 3
    ? (() => {
        const protein = advancedMacroTarget('protein', macro.proteinUnit, macro.proteinValue, calorieTarget, weight, null, null)
        const fat = advancedMacroTarget('fat', macro.fatUnit, macro.fatValue, calorieTarget, weight, protein, null)
        return {protein, fat, carbohydrate: advancedMacroTarget('carbohydrate', macro.carbsUnit, macro.carbsValue, calorieTarget, weight, protein, fat)}
      })()
    : undefined
  return context.goals.map((goal) => {
    const rule = resolveRule(context.rules.filter((item) => item.goalType === goal.goalType), date, day)
    const actual = round(totals[GOAL_NUTRIENT[goal.goalType] ?? goal.goalType] ?? 0)
    const hasAdvancedMacro = macro?.mode === 3 && (goal.goalType === 'protein' || goal.goalType === 'carbohydrate' || goal.goalType === 'fat')
    const target = goal.goalType === 'calorie' ? calorieTarget : hasAdvancedMacro ? advancedTargets?.[goal.goalType as keyof typeof advancedTargets] ?? null : targetForRule(rule, goal.goalType, calorieTarget)
    const bounds = goal.goalType === 'calorie' && isAutomatic && target !== null
      ? numeric(calorieRule?.toleranceValue) === undefined
        ? (finite(weightGoal?.desiredWeightChangePerWeek) ?? 0) > 0 ? {lowerBound: round(target), upperBound: null} : {lowerBound: null, upperBound: round(target)}
        : boundsForRule(calorieRule, target, goal.goalType, calorieTarget)
      : hasAdvancedMacro && target !== null
        ? boundsForRule({...rule!, toleranceValue: macro!.toleranceValue, toleranceUnit: macro!.toleranceUnit}, target)
        : boundsForRule(rule, target, goal.goalType, calorieTarget)
    return {goalId: normalizeId(goal.goalID), type: goal.goalType, target: target === null ? null : round(target), lowerBound: bounds.lowerBound === null ? null : round(bounds.lowerBound), upperBound: bounds.upperBound === null ? null : round(bounds.upperBound), actual}
  })
}

function summarizeDay(db: FoodNomsDatabase, date: string, raw: EntryRow[], definitions = mealTypes(db), goalContext = loadGoalContext(db)) {
  const entries = raw.map(entry)
  const totals = sumNutrients(entries.map((item) => item.nutrients))
  totals.calories = round(raw.reduce((total, item) => total + (item.calories ?? 0), 0))
  const grouped = new Map<string, typeof entries>()
  for (const item of entries) {
    const key = item.mealTypeId ?? ''
    grouped.set(key, [...(grouped.get(key) ?? []), item])
  }
  const meals = [...grouped.entries()].map(([mealTypeId, items]) => ({mealTypeId: mealTypeId || null, name: definitions.get(mealTypeId)?.name ?? (mealTypeId ? `Meal ${mealTypeId}` : 'Meal'), sortIndex: definitions.get(mealTypeId)?.sortIndex ?? Number.MAX_SAFE_INTEGER, totals: {calories: round(items.reduce((total, item) => total + item.calories, 0)), nutrients: sumNutrients(items.map((item) => item.nutrients))}, entries: items})).sort((a, b) => a.sortIndex - b.sortIndex)
  return {date, totals: {calories: totals.calories, nutrients: Object.fromEntries(Object.entries(totals).filter(([name]) => name !== 'calories'))}, goals: goalsFor(db, date, totals, goalContext), meals, entries}
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
  const goalContext = loadGoalContext(db)
  const daily = dates.map((date) => summarizeDay(db, date, rowsByDate.get(date) ?? [], definitions, goalContext))
  const nutrients = sumNutrients(daily.map((day) => ({...day.totals.nutrients, calories: day.totals.calories})))
  const averages = Object.fromEntries(Object.entries(nutrients).map(([name, amount]) => [name, round(amount / dates.length)]))
  return {from, to, dayCount: dates.length, totals: {calories: nutrients.calories ?? 0, nutrients: Object.fromEntries(Object.entries(nutrients).filter(([name]) => name !== 'calories'))}, averages: {calories: averages.calories ?? 0, nutrients: Object.fromEntries(Object.entries(averages).filter(([name]) => name !== 'calories'))}, items: daily.map((item) => ({date: item.date, totals: item.totals, goals: item.goals}))}
}

export function listFoods(db: FoodNomsDatabase, options: {q?: string; limit: number; sort: 'name' | '-lastLoggedAt'; cursor?: string}) {
  let cursor: {name: string; date: string | null; id: string; sort: 'name' | '-lastLoggedAt'; q: string} | undefined
  if (options.cursor) {
    try { cursor = JSON.parse(Buffer.from(options.cursor, 'base64url').toString('utf8')) as typeof cursor } catch { throw new InvalidFoodCursorError() }
    if (!cursor || typeof cursor.name !== 'string' || (typeof cursor.date !== 'string' && cursor.date !== null) || typeof cursor.id !== 'string' || cursor.sort !== options.sort || cursor.q !== (options.q ?? '')) throw new InvalidFoodCursorError()
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
  const foods = selected.map((row) => ({foodId: normalizeId(row.foodID), name: row.name ?? '', brandOwner: row.brandOwner, baseAmount: numeric(row.baseAmount), baseUnit: row.baseUnit, source: row.source, barcode: row.barcode, lastLoggedAt: formatTimestamp(row.lastLoggedAt), ...foodNutrients(row.nutrients)}))
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
  return {foodId: normalizeId(row.foodID), name: row.name ?? '', brandOwner: row.brandOwner, baseAmount: numeric(row.baseAmount), baseUnit: row.baseUnit, source: row.source, barcode: row.barcode, lastLoggedAt: formatTimestamp(row.date), ...foodNutrients(row.nutrients)}
}

function component(row: EntryRow) {
  const measure = parseMeasure(row.measure ?? null)
  return {
    name: row.name ?? '',
    collectionSortIndex: typeof row.collectionSortIndex === 'number' && Number.isInteger(row.collectionSortIndex) ? row.collectionSortIndex : null,
    quantity: numeric(row.quantity),
    baseAmount: numeric(row.baseAmount),
    baseUnit: row.baseUnit ?? null,
    ...(measure ? {measure} : {}),
    calories: round(row.calories ?? 0),
    nutrients: scaleNutrients(row),
  }
}

export function listLibrary(db: FoodNomsDatabase, collectionType: 2 | 3) {
  const collections = db.sqlite.prepare(`SELECT collectionID, collectionEditID, name, collectionType, dateCreated, dateLastUpdated, servings, servingSizeUnit, totalServingSize, color, icon, urlString, notes FROM foodCollectionRecord WHERE collectionType = ? ORDER BY name COLLATE NOCASE ASC, hex(collectionID) ASC`).all(collectionType) as CollectionRow[]
  const entries = db.sqlite.prepare(`SELECT id, entryID, date, tzID, day, mealTypeID, name, calories, quantity, baseAmount, baseUnit, nutrients, foodID, brandOwner, barcode, source, collectionEditID, collectionSortIndex, measure FROM foodEntryRecord WHERE collectionEditID IS NOT NULL ORDER BY collectionSortIndex IS NULL ASC, collectionSortIndex ASC, id ASC`).all() as EntryRow[]
  const byEditId = new Map<string, EntryRow[]>()
  for (const row of entries) {
    const key = normalizeId(row.collectionEditID ?? null)
    if (key !== null) byEditId.set(key, [...(byEditId.get(key) ?? []), row])
  }
  return {
    items: collections.map((row) => {
      const metadata = Object.fromEntries(Object.entries({color: row.color, icon: row.icon, url: row.urlString, notes: row.notes}).filter(([, value]) => value !== null))
      const servings = numeric(row.servings)
      const recipeServing = Object.fromEntries(Object.entries({servings, servingSizeUnit: row.servingSizeUnit, totalServingSize: numeric(row.totalServingSize)}).filter(([, value]) => value !== null && value !== undefined))
      const components = (byEditId.get(normalizeId(row.collectionEditID) ?? '') ?? []).map(component)
      const nutrients = sumNutrients(components.map((item) => item.nutrients))
      const totals = {calories: round(components.reduce((total, item) => total + item.calories, 0)), nutrients}
      return {
        collectionId: normalizeId(row.collectionID),
        kind: collectionType === 3 ? 'recipe' as const : 'meal' as const,
        type: row.collectionType,
        name: row.name ?? '',
        createdAt: formatTimestamp(row.dateCreated),
        updatedAt: formatTimestamp(row.dateLastUpdated),
        ...(Object.keys(metadata).length ? {metadata} : {}),
        ...(collectionType === 3 && Object.keys(recipeServing).length ? {recipe: recipeServing} : {}),
        totals,
        ...(collectionType === 3 && servings !== undefined && servings > 0 ? {servingTotals: {calories: round(totals.calories / servings), nutrients: Object.fromEntries(Object.entries(nutrients).map(([name, amount]) => [name, round(amount / servings)]))}} : {}),
        components,
      }
    }),
  }
}

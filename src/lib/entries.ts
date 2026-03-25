import {Kysely} from 'kysely'
import {sql} from 'kysely'

import {DatabaseSchema} from '../db/schema.js'
import {mealName, parseNutrients} from './nutrients.js'

export async function getEntriesForDate(db: Kysely<DatabaseSchema>, date: string) {
  const rows = await db
    .selectFrom('foodEntryRecord')
    .select([
      'entryID',
      'mealTypeID',
      'name',
      'calories',
      'quantity',
      'baseAmount',
      'baseUnit',
      'nutrients',
      'brandOwner',
    ])
    .where(sql`date(date)`, '=', date)
    .orderBy('mealTypeID')
    .execute()

  return rows.map((r) => ({
    entryID: r.entryID,
    mealTypeID: r.mealTypeID,
    name: r.name,
    calories: r.calories,
    quantity: r.quantity,
    baseAmount: r.baseAmount,
    baseUnit: r.baseUnit,
    brandOwner: r.brandOwner ?? undefined,
    nutrients: parseNutrients(r.nutrients),
  }))
}

export async function getMealsForDate(db: Kysely<DatabaseSchema>, date: string) {
  const entries = await getEntriesForDate(db, date)

  const mealTypes = await db
    .selectFrom('mealTypeRecord')
    .select(['mealTypeID', 'name', 'sortIndex'])
    .where('disabled', '=', 0)
    .orderBy('sortIndex')
    .execute()

  const mealMap = new Map(mealTypes.map((m) => [m.mealTypeID, m]))

  const grouped = new Map<string, typeof entries>()
  for (const entry of entries) {
    const list = grouped.get(entry.mealTypeID) ?? []
    list.push(entry)
    grouped.set(entry.mealTypeID, list)
  }

  const meals = []
  for (const [mealTypeID, mealEntries] of grouped) {
    const meta = mealMap.get(mealTypeID)
    const totalCalories = mealEntries.reduce((sum, e) => sum + e.calories, 0)
    meals.push({
      mealTypeID,
      name: mealName(mealTypeID, meta?.name ?? null),
      sortIndex: meta?.sortIndex ?? 99,
      totalCalories: Number(totalCalories.toFixed(2)),
      entries: mealEntries,
    })
  }

  return meals.sort((a, b) => a.sortIndex - b.sortIndex)
}

export function sumEntryCalories(
  entries: {calories: number}[],
): number {
  return Number(entries.reduce((sum, e) => sum + e.calories, 0).toFixed(2))
}

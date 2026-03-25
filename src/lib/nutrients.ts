import {NutrientRecord} from '../db/schema.js'

export function parseNutrients(raw: string | null | undefined): NutrientRecord {
  if (!raw) return {} as NutrientRecord
  try {
    return JSON.parse(raw) as NutrientRecord
  } catch {
    return {} as NutrientRecord
  }
}

export function sumNutrients(records: NutrientRecord[]): NutrientRecord {
  const result = {} as Record<string, number>
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) {
      result[key] = (result[key] ?? 0) + (value ?? 0)
    }
  }

  return result as unknown as NutrientRecord
}

export function averageNutrients(records: NutrientRecord[], days: number): NutrientRecord {
  const sum = sumNutrients(records)
  const result = {} as Record<string, number>
  for (const [key, value] of Object.entries(sum)) {
    result[key] = Number((value / days).toFixed(2))
  }

  return result as unknown as NutrientRecord
}

// FoodNoms uses built-in names for meal types since the name column is empty in the DB
// Built-in meal types have empty name column — these are the app defaults
const MEAL_NAMES: Record<string, string> = {
  '1': 'Breakfast',
  '2': 'Lunch',
  '3': 'Dinner',
  '4': 'Snack',
  '5': 'Pre-Workout',
  '6': 'Post-Workout',
}

export function mealName(mealTypeID: string, dbName: string | null | undefined): string {
  if (dbName) return dbName
  return MEAL_NAMES[mealTypeID] ?? `Meal ${mealTypeID}`
}

// Goal mode constants
export const GOAL_MODE = {
  1: 'maximum',
  2: 'minimum',
  4: 'tracking',
} as const

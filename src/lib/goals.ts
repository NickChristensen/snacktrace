import {Kysely} from 'kysely'

import {DatabaseSchema, NutrientRecord} from '../db/schema.js'
import {GOAL_MODE} from './nutrients.js'

export async function getGoalProgress(
  db: Kysely<DatabaseSchema>,
  totals: NutrientRecord & {calories: number},
) {
  const goals = await db
    .selectFrom('goalRecord')
    .select(['goalType', 'sortIndex'])
    .orderBy('sortIndex')
    .execute()

  const rules = await db
    .selectFrom('goalRuleRecord')
    .select(['goalType', 'mode', 'lowerBound', 'upperBound'])
    .where('dayOfWeek', 'is', null) // default (every day) rules
    .execute()

  const ruleMap = new Map(rules.map((r) => [r.goalType, r]))

  const nutrientMap: Record<string, number> = {
    calorie: totals.calories,
    protein: totals.protein,
    carbohydrate: totals.carbs,
    fat: totals.fat,
    fatSaturated: totals.fatSaturated,
    fiber: totals.fiber,
    caffeine: totals.caffeine,
  }

  return goals.map((g) => {
    const rule = ruleMap.get(g.goalType)
    const actual = Number((nutrientMap[g.goalType] ?? 0).toFixed(2))

    if (!rule) {
      return {type: g.goalType, actual}
    }

    const mode = GOAL_MODE[rule.mode as keyof typeof GOAL_MODE] ?? rule.mode
    const target = rule.upperBound ?? rule.lowerBound ?? null
    const progress = target ? Number((actual / target).toFixed(4)) : null

    return {
      type: g.goalType,
      mode,
      lowerBound: rule.lowerBound,
      upperBound: rule.upperBound,
      actual,
      progress,
    }
  })
}

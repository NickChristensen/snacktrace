import {BaseCommand} from '../base-command.js'
import {getDb} from '../db/index.js'
import {GOAL_MODE} from '../lib/nutrients.js'

export default class Goals extends BaseCommand {
  static description = 'Show configured nutrition goals'

  async run() {
    const db = getDb()

    const goals = await db
      .selectFrom('goalRecord')
      .select(['goalID', 'goalType', 'sortIndex'])
      .orderBy('sortIndex')
      .execute()

    const rules = await db
      .selectFrom('goalRuleRecord')
      .select(['goalType', 'mode', 'lowerBound', 'upperBound', 'dayOfWeek', 'isOverride'])
      .execute()

    const rulesByType: Record<string, typeof rules> = {}
    for (const rule of rules) {
      if (!rulesByType[rule.goalType]) rulesByType[rule.goalType] = []
      rulesByType[rule.goalType].push(rule)
    }

    return {
      goals: goals.map((g) => ({
        type: g.goalType,
        rules: (rulesByType[g.goalType] ?? []).map((r) => ({
          mode: GOAL_MODE[r.mode as keyof typeof GOAL_MODE] ?? r.mode,
          lowerBound: r.lowerBound,
          upperBound: r.upperBound,
          dayOfWeek: r.dayOfWeek,
          isOverride: Boolean(r.isOverride),
        })),
      })),
    }
  }
}

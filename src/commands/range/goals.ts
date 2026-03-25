import {Args} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'
import {getDb} from '../../db/index.js'
import {getEntriesForDate, sumEntryCalories} from '../../lib/entries.js'
import {sumNutrients} from '../../lib/nutrients.js'
import {getGoalProgress} from '../../lib/goals.js'
import {dateRange, parseDate} from '../../lib/date.js'

type GoalResult = Awaited<ReturnType<typeof getGoalProgress>>

interface DayGoals {
  date: string
  goals: GoalResult
}

export default class RangeGoals extends BaseCommand {
  static description = 'Goal progress over a date range with per-day breakdown and averages'

  static args = {
    from: Args.string({description: 'Start date (YYYY-MM-DD)', required: true}),
    to: Args.string({description: 'End date (YYYY-MM-DD)', required: true}),
  }

  async run() {
    const {args} = await this.parse(RangeGoals)
    const from = parseDate(args.from)
    const to = parseDate(args.to)
    const db = getDb()

    const dates = dateRange(from, to)
    const daily: DayGoals[] = []

    for (const date of dates) {
      const entries = await getEntriesForDate(db, date)
      const nutrients = sumNutrients(entries.map((e) => e.nutrients))
      const calories = sumEntryCalories(entries)
      const goals = await getGoalProgress(db, {...nutrients, calories})
      daily.push({date, goals})
    }

    const goalTypes = daily[0]?.goals.map((g) => g.type) ?? []
    const averages = goalTypes.map((type) => {
      const daysWithData = daily.filter((d) => d.goals.some((g) => g.type === type))
      const actuals = daysWithData.map((d) => d.goals.find((g) => g.type === type)?.actual ?? 0)
      const avg = actuals.reduce((s, v) => s + v, 0) / (daysWithData.length || 1)
      const sample = daily[0]?.goals.find((g) => g.type === type)
      return {
        type,
        ...(sample && 'mode' in sample ? {mode: sample.mode} : {}),
        ...(sample && 'upperBound' in sample ? {upperBound: sample.upperBound} : {}),
        ...(sample && 'lowerBound' in sample ? {lowerBound: sample.lowerBound} : {}),
        averageActual: Number(avg.toFixed(2)),
      }
    })

    return {from, to, days: dates.length, averages, daily}
  }
}

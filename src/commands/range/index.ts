import {Args} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'
import {getDb} from '../../db/index.js'
import {getEntriesForDate, sumEntryCalories} from '../../lib/entries.js'
import {averageNutrients, sumNutrients} from '../../lib/nutrients.js'
import {dateRange, parseDate} from '../../lib/date.js'

export default class Range extends BaseCommand {
  static description = 'Summary over a date range: totals, averages, and per-day breakdown'

  static args = {
    from: Args.string({
      description: 'Start date (YYYY-MM-DD, "yesterday", or a relative offset like "-7d")',
      required: true,
    }),
    to: Args.string({
      description: 'End date (YYYY-MM-DD, "yesterday", or a relative offset like "-1d")',
      required: true,
    }),
  }

  async run() {
    const {args} = await this.parse(Range)
    const from = parseDate(args.from)
    const to = parseDate(args.to)
    const db = getDb()

    const dates = dateRange(from, to)
    const days = []
    const allNutrients = []

    for (const date of dates) {
      const entries = await getEntriesForDate(db, date)
      const nutrients = sumNutrients(entries.map((e) => e.nutrients))
      const calories = sumEntryCalories(entries)
      allNutrients.push({...nutrients, calories})
      days.push({date, calories, nutrients})
    }

    const totalCalories = Number(allNutrients.reduce((s, n) => s + n.calories, 0).toFixed(2))
    const totals = sumNutrients(allNutrients)
    const averages = averageNutrients(allNutrients, dates.length)

    return {
      from,
      to,
      days: dates.length,
      totals: {...totals, calories: totalCalories},
      averages,
      daily: days,
    }
  }
}

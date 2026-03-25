import {Args} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'
import {getDb} from '../../db/index.js'
import {getEntriesForDate, sumEntryCalories} from '../../lib/entries.js'
import {sumNutrients} from '../../lib/nutrients.js'
import {dateRange, parseDate} from '../../lib/date.js'

export default class RangeDays extends BaseCommand {
  static description = 'Per-day nutrient totals over a date range'

  static args = {
    from: Args.string({description: 'Start date (YYYY-MM-DD)', required: true}),
    to: Args.string({description: 'End date (YYYY-MM-DD)', required: true}),
  }

  async run() {
    const {args} = await this.parse(RangeDays)
    const from = parseDate(args.from)
    const to = parseDate(args.to)
    const db = getDb()

    const dates = dateRange(from, to)
    const days = []

    for (const date of dates) {
      const entries = await getEntriesForDate(db, date)
      const nutrients = sumNutrients(entries.map((e) => e.nutrients))
      const calories = sumEntryCalories(entries)
      days.push({date, calories, nutrients})
    }

    return {from, to, days}
  }
}

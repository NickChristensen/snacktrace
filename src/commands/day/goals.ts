import {Args} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'
import {getDb} from '../../db/index.js'
import {getEntriesForDate, sumEntryCalories} from '../../lib/entries.js'
import {getGoalProgress} from '../../lib/goals.js'
import {sumNutrients} from '../../lib/nutrients.js'
import {parseDate} from '../../lib/date.js'

export default class DayGoals extends BaseCommand {
  static description = 'Goal progress for a day'

  static args = {
    date: Args.string({
      description: 'Date to query (YYYY-MM-DD, "today", or "yesterday")',
      default: 'today',
    }),
  }

  async run() {
    const {args} = await this.parse(DayGoals)
    const date = parseDate(args.date)
    const db = getDb()

    const entries = await getEntriesForDate(db, date)
    const totals = sumNutrients(entries.map((e) => e.nutrients))
    const goals = await getGoalProgress(db, {...totals, calories: sumEntryCalories(entries)})

    return {date, goals}
  }
}

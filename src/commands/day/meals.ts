import {Args} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'
import {getDb} from '../../db/index.js'
import {getMealsForDate} from '../../lib/entries.js'
import {parseDate} from '../../lib/date.js'

export default class DayMeals extends BaseCommand {
  static description = 'Entries grouped by meal for a day'

  static args = {
    date: Args.string({
      description: 'Date to query (YYYY-MM-DD, "today", or "yesterday")',
      default: 'today',
    }),
  }

  async run() {
    const {args} = await this.parse(DayMeals)
    const date = parseDate(args.date)
    const db = getDb()

    const meals = await getMealsForDate(db, date)

    return {
      date,
      meals: meals.map((m) => ({
        mealTypeID: m.mealTypeID,
        name: m.name,
        totalCalories: m.totalCalories,
        entries: m.entries.map(({mealTypeID: _, ...e}) => e),
      })),
    }
  }
}

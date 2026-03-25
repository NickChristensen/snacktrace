import {Args} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'
import {getDb} from '../../db/index.js'
import {getEntriesForDate, getMealsForDate, sumEntryCalories} from '../../lib/entries.js'
import {getGoalProgress} from '../../lib/goals.js'
import {sumNutrients} from '../../lib/nutrients.js'
import {parseDate} from '../../lib/date.js'

export default class Day extends BaseCommand {
  static description = 'Full summary for a day: goals, meals, and foods'

  static args = {
    date: Args.string({
      description: 'Date to query (YYYY-MM-DD, "today", or "yesterday")',
      default: 'today',
    }),
  }

  async run() {
    const {args} = await this.parse(Day)
    const date = parseDate(args.date)
    const db = getDb()

    const entries = await getEntriesForDate(db, date)
    const meals = await getMealsForDate(db, date)
    const allNutrients = entries.map((e) => e.nutrients)
    const totals = sumNutrients(allNutrients)
    const goals = await getGoalProgress(db, {...totals, calories: sumEntryCalories(entries)})

    return {
      date,
      totals: {
        ...totals,
        calories: sumEntryCalories(entries),
      },
      goals,
      meals: meals.map((m) => ({
        mealTypeID: m.mealTypeID,
        name: m.name,
        totalCalories: m.totalCalories,
        entries: m.entries.map(({mealTypeID: _, ...e}) => e),
      })),
    }
  }
}

import {Args} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'
import {getDb} from '../../db/index.js'
import {getEntriesForDate} from '../../lib/entries.js'
import {mealName} from '../../lib/nutrients.js'
import {parseDate} from '../../lib/date.js'

export default class DayFoods extends BaseCommand {
  static description = 'Flat list of all foods consumed on a day'

  static args = {
    date: Args.string({
      description: 'Date to query (YYYY-MM-DD, "today", or "yesterday")',
      default: 'today',
    }),
  }

  async run() {
    const {args} = await this.parse(DayFoods)
    const date = parseDate(args.date)
    const db = getDb()

    const entries = await getEntriesForDate(db, date)

    return {
      date,
      entries: entries.map((e) => ({
        name: e.name,
        meal: mealName(e.mealTypeID, null),
        mealTypeID: e.mealTypeID,
        calories: e.calories,
        quantity: e.quantity,
        baseAmount: e.baseAmount,
        baseUnit: e.baseUnit,
        brandOwner: e.brandOwner,
        nutrients: e.nutrients,
      })),
    }
  }
}

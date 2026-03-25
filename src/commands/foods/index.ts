import {Flags} from '@oclif/core'
import {sql} from 'kysely'

import {BaseCommand} from '../../base-command.js'
import {getDb} from '../../db/index.js'
import {parseNutrients} from '../../lib/nutrients.js'

const PAGE_SIZE = 50

export default class Foods extends BaseCommand {
  static description = 'Browse distinct foods from your entry history'

  static flags = {
    limit: Flags.integer({
      char: 'l',
      description: 'Number of results to return',
      default: PAGE_SIZE,
    }),
    offset: Flags.integer({
      char: 'o',
      description: 'Offset for pagination',
      default: 0,
    }),
  }

  async run() {
    const {flags} = await this.parse(Foods)
    const db = getDb()

    const foods = await db
      .selectFrom('foodEntryRecord')
      .select([
        'foodID',
        'name',
        'brandOwner',
        'baseAmount',
        'baseUnit',
        'nutrients',
        'source',
        sql<string>`max(date)`.as('lastLogged'),
      ])
      .groupBy('foodID')
      .orderBy('name')
      .limit(flags.limit)
      .offset(flags.offset)
      .execute()

    return {
      offset: flags.offset,
      limit: flags.limit,
      count: foods.length,
      foods: foods.map((f) => {
        const nutrients = parseNutrients(f.nutrients)
        return {
          foodID: f.foodID,
          name: f.name,
          brandOwner: f.brandOwner,
          baseAmount: f.baseAmount,
          baseUnit: f.baseUnit,
          calories: nutrients.calories,
          source: f.source,
          lastLogged: f.lastLogged,
        }
      }),
    }
  }
}

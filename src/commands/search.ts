import {Args, Flags} from '@oclif/core'
import {sql} from 'kysely'

import {BaseCommand} from '../base-command.js'
import {getDb} from '../db/index.js'
import {parseNutrients} from '../lib/nutrients.js'

export default class Search extends BaseCommand {
  static description = 'Search foods by name across your entry history'

  static args = {
    query: Args.string({description: 'Search term', required: true}),
  }

  static flags = {
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of results',
      default: 20,
    }),
  }

  async run() {
    const {args, flags} = await this.parse(Search)
    const db = getDb()

    // Distinct foods from entry history, most recently logged first
    const results = await db
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
      .where('name', 'like', `%${args.query}%`)
      .groupBy('foodID')
      .orderBy('lastLogged', 'desc')
      .limit(flags.limit)
      .execute()

    return {
      query: args.query,
      count: results.length,
      results: results.map((f) => {
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

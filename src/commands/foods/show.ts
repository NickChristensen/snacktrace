import {Args} from '@oclif/core'
import {sql} from 'kysely'

import {BaseCommand} from '../../base-command.js'
import {getDb} from '../../db/index.js'
import {parseNutrients} from '../../lib/nutrients.js'

export default class FoodsShow extends BaseCommand {
  static description = 'Full nutrient detail for a food by foodID'

  static args = {
    foodID: Args.string({description: 'foodID of the food to show', required: true}),
  }

  async run() {
    const {args} = await this.parse(FoodsShow)
    const db = getDb()

    // Look in entry history (denormalized food data)
    const food = await db
      .selectFrom('foodEntryRecord')
      .select([
        'foodID',
        'name',
        'brandOwner',
        'baseAmount',
        'baseUnit',
        'nutrients',
        'source',
        'barcode',
        sql<string>`max(date)`.as('lastLogged'),
      ])
      .where('foodID', '=', args.foodID)
      .groupBy('foodID')
      .executeTakeFirst()

    if (!food) {
      throw new Error(`No food found with foodID "${args.foodID}"`)
    }

    return {
      foodID: food.foodID,
      name: food.name,
      brandOwner: food.brandOwner,
      baseAmount: food.baseAmount,
      baseUnit: food.baseUnit,
      source: food.source,
      barcode: food.barcode,
      lastLogged: food.lastLogged,
      nutrients: parseNutrients(food.nutrients),
    }
  }
}

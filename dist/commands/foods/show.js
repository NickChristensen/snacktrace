"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const kysely_1 = require("kysely");
const base_command_js_1 = require("../../base-command.js");
const index_js_1 = require("../../db/index.js");
const nutrients_js_1 = require("../../lib/nutrients.js");
class FoodsShow extends base_command_js_1.BaseCommand {
    static description = 'Full nutrient detail for a food by foodID';
    static args = {
        foodID: core_1.Args.string({ description: 'foodID of the food to show', required: true }),
    };
    async run() {
        const { args } = await this.parse(FoodsShow);
        const db = (0, index_js_1.getDb)();
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
            (0, kysely_1.sql) `max(date)`.as('lastLogged'),
        ])
            .where('foodID', '=', args.foodID)
            .groupBy('foodID')
            .executeTakeFirst();
        if (!food) {
            throw new Error(`No food found with foodID "${args.foodID}"`);
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
            nutrients: (0, nutrients_js_1.parseNutrients)(food.nutrients),
        };
    }
}
exports.default = FoodsShow;
//# sourceMappingURL=show.js.map
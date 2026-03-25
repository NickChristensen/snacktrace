"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const kysely_1 = require("kysely");
const base_command_js_1 = require("../../base-command.js");
const index_js_1 = require("../../db/index.js");
const nutrients_js_1 = require("../../lib/nutrients.js");
const PAGE_SIZE = 50;
class Foods extends base_command_js_1.BaseCommand {
    static description = 'Browse distinct foods from your entry history';
    static flags = {
        limit: core_1.Flags.integer({
            char: 'l',
            description: 'Number of results to return',
            default: PAGE_SIZE,
        }),
        offset: core_1.Flags.integer({
            char: 'o',
            description: 'Offset for pagination',
            default: 0,
        }),
    };
    async run() {
        const { flags } = await this.parse(Foods);
        const db = (0, index_js_1.getDb)();
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
            (0, kysely_1.sql) `max(date)`.as('lastLogged'),
        ])
            .groupBy('foodID')
            .orderBy('name')
            .limit(flags.limit)
            .offset(flags.offset)
            .execute();
        return {
            offset: flags.offset,
            limit: flags.limit,
            count: foods.length,
            foods: foods.map((f) => {
                const nutrients = (0, nutrients_js_1.parseNutrients)(f.nutrients);
                return {
                    foodID: f.foodID,
                    name: f.name,
                    brandOwner: f.brandOwner,
                    baseAmount: f.baseAmount,
                    baseUnit: f.baseUnit,
                    calories: nutrients.calories,
                    source: f.source,
                    lastLogged: f.lastLogged,
                };
            }),
        };
    }
}
exports.default = Foods;
//# sourceMappingURL=index.js.map
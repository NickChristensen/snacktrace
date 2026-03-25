"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const kysely_1 = require("kysely");
const base_command_js_1 = require("../base-command.js");
const index_js_1 = require("../db/index.js");
const nutrients_js_1 = require("../lib/nutrients.js");
class Search extends base_command_js_1.BaseCommand {
    static description = 'Search foods by name across your entry history';
    static args = {
        query: core_1.Args.string({ description: 'Search term', required: true }),
    };
    static flags = {
        limit: core_1.Flags.integer({
            char: 'l',
            description: 'Maximum number of results',
            default: 20,
        }),
    };
    async run() {
        const { args, flags } = await this.parse(Search);
        const db = (0, index_js_1.getDb)();
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
            (0, kysely_1.sql) `max(date)`.as('lastLogged'),
        ])
            .where('name', 'like', `%${args.query}%`)
            .groupBy('foodID')
            .orderBy('lastLogged', 'desc')
            .limit(flags.limit)
            .execute();
        return {
            query: args.query,
            count: results.length,
            results: results.map((f) => {
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
exports.default = Search;
//# sourceMappingURL=search.js.map